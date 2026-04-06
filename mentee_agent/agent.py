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
    page: str = "/"
    skip_count: int = 0


# Page to program mapping for FAQ pages
PAGE_PROGRAM_MAP = {
    "/CNA_FAQ.html": "Nurse Aide (CNA)",
    "/CPR_FAQ.html": "CPR & BLS Certification",
    "/EKG_FAQ.html": "EKG Technician",
    "/Phlebotomy_FAQ.html": "Phlebotomy",
    "/PCT_FAQ.html": "Patient Care Technician",
    "/MedicationAide_FAQ.html": "Medication Aide",
    "/MA(certificate)_FAQ.html": "Medical Assistant Certificate",
    "/MA(associate)_FAQ.html": "Medical Assistant Associates",
    "/PN_FAQ.html": "Practical Nursing",
    "/SonographyFAQ.html": "Sonography",
}

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


def start_conversation(page="/"):
    """Create a new conversation session with page-aware greeting."""
    session = ConversationSession(page=page)

    if page == "/Application.html":
        message = (
            "Hey there! I see you are on the application page, that is awesome! "
            "I can help you through the whole process. Before we get started, "
            "can I get your name so our admissions team can follow up with you?"
        )
        session.phase = "name"
    elif page in PAGE_PROGRAM_MAP:
        program = PAGE_PROGRAM_MAP[page]
        message = (
            f"Hey there! I see you are checking out our {program} program, great choice! "
            f"I can tell you everything about it. Before I do, can I grab your name "
            f"real quick so we do not lose touch?"
        )
        session.phase = "name"
    else:
        message = (
            "Hey there! Welcome to Mentee College. We help people just like you "
            "start rewarding careers in healthcare. Are you interested in learning "
            "more about our programs?"
        )

    session.message_history.append({"role": "assistant", "content": message})

    options = None
    if session.phase == "greeting":
        options = ["Yes", "No"]

    return {
        "message": message,
        "options": options,
        "phase": session.phase,
        "lead": session.lead.model_dump(),
        "navigate_to": None,
        "session_id": session.session_id,
    }, session


def handle_message(session, user_message, faq_collection, programs, api_key,
                   model="gpt-4o-mini-2024-07-18", page=None):
    """Process a user message based on the current conversation phase."""
    if page:
        session.page = page
    session.message_history.append({"role": "user", "content": user_message})
    session.navigate_to = None

    if session.phase == "greeting":
        return _handle_greeting(session, user_message)
    elif session.phase == "name":
        return _handle_name(session, user_message, faq_collection, programs, api_key, model)
    elif session.phase == "program":
        return _handle_program(session, user_message, faq_collection, programs, api_key, model)
    elif session.phase == "phone":
        return _handle_phone(session, user_message, faq_collection, programs, api_key, model)
    elif session.phase == "faq":
        return _handle_faq(session, user_message, faq_collection, programs, api_key, model)

    return _make_response(session, "Something went wrong. Call us at (770) 931-5020 and we will help you out.")


def _looks_like_answer(user_message, phase):
    """Check if the user's message looks like it answers the current question."""
    msg = user_message.strip().lower()
    if phase == "name":
        # Names are usually 1-3 words, no question marks
        return "?" not in msg and len(msg.split()) <= 4 and len(msg) < 40 and not any(
            kw in msg for kw in ["how", "what", "cost", "price", "program", "much", "long", "require"]
        )
    elif phase == "phone":
        # Phone numbers have digits
        digits = sum(1 for c in msg if c.isdigit())
        return digits >= 7
    elif phase == "program":
        # Check if it matches or partially matches a program option
        for opt in PROGRAM_OPTIONS:
            if msg in opt.lower() or opt.lower() in msg:
                return True
        return False
    return True


def _handle_skip(session, user_message, faq_collection, programs, api_key, model, current_ask):
    """Handle when the user skips a guided question — use LLM to respond naturally."""
    session.skip_count += 1

    if session.skip_count >= 2:
        # Stop pushing, switch to FAQ mode
        session.phase = "faq"
        return _handle_faq(session, user_message, faq_collection, programs, api_key, model)

    # Use LLM to acknowledge their question and steer back
    client = OpenAI(api_key=api_key)
    steer_prompt = (
        "You are a friendly admissions rep for Mentee College. The student just said something "
        "instead of answering your question. Acknowledge what they said briefly, then naturally "
        "steer back to getting their info. Keep it to 2-3 sentences max. No emojis, no markdown, "
        "no bullet points. Sound like a real person.\n\n"
        f"You asked: {current_ask}\n"
        f"They said: {user_message}\n\n"
        "Explain that you want their info so you can make sure they do not miss out and so "
        "the admissions team can follow up in case the chat disconnects. Then re-ask the question."
    )
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": steer_prompt}],
            temperature=0.7,
            max_tokens=200,
        )
        reply = completion.choices[0].message.content
    except Exception:
        reply = (
            f"Great question! I will definitely help you with that. But first, so we do not "
            f"lose touch in case this chat ends, {current_ask.lower()}"
        )

    return _make_response(session, reply)


def _handle_greeting(session, user_message):
    msg = user_message.strip().lower()
    if msg in ("yes", "yeah", "sure", "okay", "ok", "yep", "yea", "y"):
        session.phase = "name"
        reply = (
            "That is great to hear! We have programs that can get you certified "
            "and working in as little as 4 hours for CPR or as short as 3 weeks for CNA. "
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


def _handle_name(session, user_message, faq_collection, programs, api_key, model):
    if not _looks_like_answer(user_message, "name"):
        return _handle_skip(
            session, user_message, faq_collection, programs, api_key, model,
            "What is your name?"
        )

    name = user_message.strip()
    if not name:
        return _make_response(session, "I did not catch that. What is your name?")

    session.lead.name = name
    session.phase = "program"

    # If we already know the program from the page, skip asking
    if session.page in PAGE_PROGRAM_MAP:
        program = PAGE_PROGRAM_MAP[session.page]
        session.lead.program_interest = program
        session.phase = "phone"
        reply = (
            f"Nice to meet you, {name}! Since you are already looking at {program}, "
            f"I am guessing that is the one you are interested in. "
            f"What is the best phone number for our admissions team to reach you at?"
        )
        return _make_response(session, reply)

    reply = f"Nice to meet you, {name}! Which program are you most interested in?"
    return _make_response(session, reply, options=PROGRAM_OPTIONS)


def _handle_program(session, user_message, faq_collection, programs, api_key, model):
    if not _looks_like_answer(user_message, "program"):
        return _handle_skip(
            session, user_message, faq_collection, programs, api_key, model,
            "Which program are you most interested in?"
        )

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


def _handle_phone(session, user_message, faq_collection, programs, api_key, model):
    if not _looks_like_answer(user_message, "phone"):
        return _handle_skip(
            session, user_message, faq_collection, programs, api_key, model,
            "What is the best phone number for our admissions team to reach you at?"
        )

    phone = user_message.strip()
    if not phone:
        return _make_response(session, "What is a good phone number for us to reach you?")

    session.lead.phone = phone
    session.phase = "faq"
    name = session.lead.name or "there"
    program = session.lead.program_interest or "our programs"

    if session.page == "/Application.html":
        reply = (
            f"Perfect, {name}! I have got your info and our team will follow up with you. "
            f"Now let me help you with this application. The form on this page lets you "
            f"apply for {program}. Just fill in your personal details, and if you have "
            f"any questions about any of the fields, ask me and I will walk you through it!"
        )
    else:
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
    state.lead = session.lead.model_copy()

    result = run_agent(
        state=state,
        faq_collection=faq_collection,
        programs=programs,
        api_key=api_key,
        model=model,
        conversation_history=session.message_history,
        page=session.page,
    )

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


def build_messages(state, program_list, conversation_history=None, page="/"):
    """Construct the OpenAI messages list for the current state."""
    system_prompt = build_system_prompt(program_list)

    # Add page context
    if page == "/Application.html":
        system_prompt += (
            "\n\n## Page Context\n"
            "The student is currently on the Application page. Help them fill out the form. "
            "The form has fields for: program type (Certificate/Associates/Diploma/CPR), "
            "name, address, phone, email, date of birth, gender, education level, "
            "schedule preference (Day/Evening/Weekend), and references. "
            "Certificate programs (CNA, MA) have a $35 application fee. "
            "Associates and Diploma programs have a $75 application fee. "
            "Guide them through each section if they ask for help."
        )
    elif page in PAGE_PROGRAM_MAP:
        program = PAGE_PROGRAM_MAP[page]
        system_prompt += (
            f"\n\n## Page Context\n"
            f"The student is currently viewing the {program} FAQ page. "
            f"They are likely interested in this program. Proactively offer relevant info "
            f"and always push them to apply."
        )

    # Add lead context
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

    if conversation_history:
        for msg in conversation_history[:-1]:
            messages.append({"role": msg["role"], "content": msg["content"]})

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
              conversation_history=None, page="/"):
    """Run the ReAct agent loop until FINISH or max_steps is reached."""
    client = OpenAI(api_key=api_key)

    program_list = "\n".join(
        f"- {p['full_name']} ({p['program']})" for p in programs
    )

    for step_num in range(max_steps):
        messages = build_messages(state, program_list, conversation_history, page)

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
