import re
import uuid
import logging
from typing import Optional

from pydantic import BaseModel, Field
from openai import OpenAI

from .prompts import build_system_prompt, FORMAT_NUDGE
from .actions import execute_action

logger = logging.getLogger("mentee_agent.agent")


class LeadInfo(BaseModel):
    """Collected information about the prospective student."""
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    program_interest: Optional[str] = None
    questions_asked: list[str] = Field(default_factory=list)
    programs_viewed: list[str] = Field(default_factory=list)
    pages_suggested: list[str] = Field(default_factory=list)


class ConversationSession(BaseModel):
    """Holds the full state of a multi-turn conversation."""
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phase: str = "greeting"  # greeting -> name -> program -> phone -> faq
    lead: LeadInfo = Field(default_factory=LeadInfo)
    message_history: list[dict] = Field(default_factory=list)
    navigate_to: Optional[str] = None


PROGRAM_OPTIONS = [
    "Practical Nursing",
    "Nurse Aide (CNA)",
    "Medical Assistant",
    "CPR & BLS Certification",
    "EKG Technician",
    "Phlebotomy",
    "Patient Care Technician",
    "Medication Aide",
    "Not sure yet",
]


def start_conversation():
    """Create a new conversation session and return the greeting."""
    session = ConversationSession()
    message = (
        "Hey there! Welcome to Mentee College. We help people just like you "
        "start rewarding careers in healthcare. Are you interested in learning "
        "more about our programs?"
    )
    session.message_history.append({"role": "assistant", "content": message})
    return {
        "message": message,
        "options": ["Yes", "No"],
        "phase": session.phase,
        "lead": session.lead.model_dump(),
        "navigate_to": None,
        "session_id": session.session_id,
    }, session


def handle_message(session, user_message, faq_collection, programs, api_key,
                   model="gpt-4o-mini-2024-07-18"):
    """Process a user message based on the current conversation phase."""
    session.message_history.append({"role": "user", "content": user_message})
    session.navigate_to = None

    if session.phase == "greeting":
        return _handle_greeting(session, user_message)
    elif session.phase == "name":
        return _handle_name(session, user_message)
    elif session.phase == "program":
        return _handle_program(session, user_message)
    elif session.phase == "phone":
        return _handle_phone(session, user_message)
    elif session.phase == "faq":
        return _handle_faq(session, user_message, faq_collection, programs, api_key, model)

    return _make_response(session, "Something went wrong. Call us at (770) 931-5020 and we will help you out.")


def _handle_greeting(session, user_message):
    msg = user_message.strip().lower()
    if msg in ("yes", "yeah", "sure", "okay", "ok", "yep", "yea", "y"):
        session.phase = "name"
        reply = (
            "That is great to hear! We have programs that can get you certified "
            "and working in as little as 4 hours for CPR or 6 weeks for CNA. "
            "What is your name?"
        )
        return _make_response(session, reply)
    else:
        reply = (
            "No worries at all! If you ever change your mind we are right here "
            "for you. You can always reach us at (770) 931-5020 or stop by our "
            "campus at 3545 Cruse Rd NW, Suite 100, Lawrenceville, GA 30044. "
            "We would love to help you start your healthcare career whenever you are ready."
        )
        return _make_response(session, reply)


def _handle_name(session, user_message):
    name = user_message.strip()
    if not name:
        return _make_response(session, "I did not catch that. What is your name?")

    session.lead.name = name
    session.phase = "program"
    reply = (
        f"Nice to meet you, {name}! Which program are you most interested in?"
    )
    return _make_response(session, reply, options=PROGRAM_OPTIONS)


def _handle_program(session, user_message):
    program = user_message.strip()
    if not program:
        return _make_response(session, "Which program caught your eye?", options=PROGRAM_OPTIONS)

    session.lead.program_interest = program
    session.phase = "phone"
    name = session.lead.name or "there"
    reply = (
        f"Great choice, {name}! Our admissions team would love to help you get started "
        f"with {program}. What is the best phone number for them to reach you at?"
    )
    return _make_response(session, reply)


def _handle_phone(session, user_message):
    phone = user_message.strip()
    if not phone:
        return _make_response(session, "What is a good phone number for us to reach you?")

    session.lead.phone = phone
    session.phase = "faq"
    name = session.lead.name or "there"
    program = session.lead.program_interest or "our programs"
    reply = (
        f"{name}, I have got you down for {program} and our admissions team will be "
        f"reaching out to you soon at {phone}. In the meantime, is there anything "
        f"you want to know about {program} or any of our other programs? I know "
        f"everything about pricing, requirements, schedules, you name it. Ask me anything!"
    )
    return _make_response(session, reply)


def _handle_faq(session, user_message, faq_collection, programs, api_key, model):
    """Hand off to the ReAct agent for free-form FAQ questions."""
    session.lead.questions_asked.append(user_message)

    state = AgentState(question=user_message)
    # Copy lead info into agent state
    state.lead = session.lead.model_copy()

    result = run_agent(
        state=state,
        faq_collection=faq_collection,
        programs=programs,
        api_key=api_key,
        model=model,
        conversation_history=session.message_history,
    )

    # Sync any new info the agent collected back to the session
    session.lead = state.lead
    if state.navigate_to:
        session.navigate_to = state.navigate_to

    return _make_response(session, result["response"])


def _make_response(session, message, options=None):
    """Build a standard response dict."""
    session.message_history.append({"role": "assistant", "content": message})
    return {
        "message": message,
        "options": options,
        "phase": session.phase,
        "lead": session.lead.model_dump(),
        "navigate_to": session.navigate_to,
        "session_id": session.session_id,
    }


# ─── ReAct Agent (used in FAQ phase) ───


class AgentState(BaseModel):
    question: str
    steps: list[dict] = Field(default_factory=list)
    context: dict = Field(default_factory=dict)
    lead: LeadInfo = Field(default_factory=LeadInfo)
    answer: str = ""
    navigate_to: Optional[str] = None
    done: bool = False


def parse_response(raw):
    """Extract Thought, Action, and Action Input from LLM output."""
    thought_match = re.search(
        r'Thought:\s*(.+?)(?=\nAction:|\Z)', raw, re.DOTALL
    )
    action_match = re.search(
        r'Action:\s*(.+?)(?=\nAction Input:|\Z)', raw, re.DOTALL
    )
    input_match = re.search(
        r'Action Input:\s*(.+)', raw, re.DOTALL
    )

    thought = thought_match.group(1).strip() if thought_match else ""
    action = action_match.group(1).strip() if action_match else None
    action_input = input_match.group(1).strip() if input_match else ""

    if not action:
        return raw.strip(), None, raw.strip(), False

    return thought, action, action_input, True


def build_messages(state, program_list, conversation_history=None):
    """Construct the OpenAI messages list for the current state."""
    system_prompt = build_system_prompt(program_list)

    # Add lead context to system prompt so the agent knows who it is talking to
    lead = state.lead
    if lead.name or lead.program_interest:
        system_prompt += "\n\n## Current Student Info\n"
        if lead.name:
            system_prompt += f"You are talking to {lead.name}. Use their name naturally in your responses.\n"
        if lead.program_interest:
            system_prompt += f"They are interested in: {lead.program_interest}\n"
        if lead.phone:
            system_prompt += f"Their phone number: {lead.phone} (already collected, do not ask again)\n"

    messages = [{"role": "system", "content": system_prompt}]

    # Include conversation history so the agent has context
    if conversation_history:
        for msg in conversation_history[:-1]:  # exclude the latest user message, we add it below
            messages.append({"role": msg["role"], "content": msg["content"]})

    # Build user content with any previously loaded context
    context_parts = []
    if state.context:
        context_parts.append("Previously retrieved information:")
        for key, val in state.context.items():
            context_parts.append(f"\n--- {key.upper()} ---\n{val}")

    user_content = state.question
    if context_parts:
        user_content = "\n".join(context_parts) + f"\n\nUser question: {state.question}"

    if not state.steps:
        user_content += FORMAT_NUDGE

    messages.append({"role": "user", "content": user_content})

    # Add previous agent reasoning steps
    for step in state.steps:
        assistant_text = (
            f"Thought: {step['thought']}\n"
            f"Action: {step['action']}\n"
            f"Action Input: {step['action_input']}"
        )
        messages.append({"role": "assistant", "content": assistant_text})
        messages.append({"role": "user", "content": f"Observation: {step['observation']}"})

    return messages


def _call_llm(client, messages, model, max_tokens=1920):
    """Make an OpenAI chat completion call and return the raw text."""
    completion = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0,
        max_tokens=max_tokens,
    )
    return completion.choices[0].message.content


def run_agent(state, faq_collection, programs, api_key,
              model="gpt-4o-mini-2024-07-18", max_steps=6,
              conversation_history=None):
    """Run the ReAct agent loop until FINISH or max_steps is reached."""
    client = OpenAI(api_key=api_key)

    program_list = "\n".join(
        f"- {p['full_name']} ({p['program']})" for p in programs
    )

    for step_num in range(max_steps):
        messages = build_messages(state, program_list, conversation_history)

        logger.info(f"Agent step {step_num + 1}")
        try:
            raw = _call_llm(client, messages, model)
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            name = state.lead.name or "there"
            state.answer = (
                f"I am sorry {name}, I had a little trouble there. Please try again "
                f"or call us at (770) 931-5020 and we will help you out right away."
            )
            state.done = True
            break

        thought, action, action_input, parsed_ok = parse_response(raw)

        if not parsed_ok and len(state.steps) == 0:
            logger.info("  Format not followed, retrying with nudge...")
            nudge_msg = {
                "role": "user",
                "content": (
                    "Your response was not in the required format. "
                    "You MUST use Thought/Action/Action Input format. "
                    "Start by searching for relevant FAQ information.\n" + FORMAT_NUDGE
                ),
            }
            messages.append({"role": "assistant", "content": raw})
            messages.append(nudge_msg)
            try:
                raw = _call_llm(client, messages, model)
                thought, action, action_input, parsed_ok = parse_response(raw)
            except Exception as e:
                logger.error(f"OpenAI API error on retry: {e}")

        if not parsed_ok:
            action = "FINISH"
            action_input = thought

        logger.info(f"  Thought: {thought[:100]}...")
        logger.info(f"  Action: {action}")

        observation = execute_action(
            action, action_input, state, faq_collection, programs,
        )

        state.steps.append({
            "step": step_num + 1,
            "thought": thought,
            "action": action,
            "action_input": action_input,
            "observation": observation if action != "FINISH" else "(final answer)",
        })

        if state.done:
            break

    if not state.done:
        name = state.lead.name or "there"
        state.answer = (
            state.steps[-1]["action_input"]
            if state.steps
            else f"I was not able to find what you need {name} but do not miss out. "
                 f"Call us at (770) 931-5020 and we will take care of you."
        )

    return {
        "response": state.answer,
        "steps": state.steps,
        "lead": state.lead.model_dump(),
        "navigate_to": state.navigate_to,
    }
