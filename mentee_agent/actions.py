import logging

logger = logging.getLogger("mentee_agent.actions")

# Pages the agent can navigate users to
PAGE_MAP = {
    "apply": "Application.html",
    "application": "Application.html",
    "contact": "contact.html",
    "about": "about.html",
    "home": "index.html",
    "gallery": "gallery.html",
    "calendar": "calendar.html",
    "login": "login.html",
    "payment": "login.html",
    "portal": "login.html",
    "cna": "CNA_FAQ.html",
    "cpr": "CPR_FAQ.html",
    "ekg": "EKG_FAQ.html",
    "phlebotomy": "Phlebotomy_FAQ.html",
    "pct": "PCT_FAQ.html",
    "medication aide": "MedicationAide_FAQ.html",
    "ma certificate": "MA(certificate)_FAQ.html",
    "ma associate": "MA(associate)_FAQ.html",
    "practical nursing": "PN_FAQ.html",
    "pn": "PN_FAQ.html",
    "sonography": "SonographyFAQ.html",
    "state authorizations": "Stateauthorizations.html",
}


def execute_action(action, action_input, state, faq_collection, programs):
    """Dispatch an agent action and return an observation string."""
    action = action.strip().upper()

    if action == "SEARCH_FAQ":
        query = action_input.strip()
        if not query:
            return "Please provide a search query in Action Input."
        # Try to detect a program name in the query and filter by it
        detected = _detect_program_in_query(query, programs)
        query_kwargs = {"query_texts": [query], "n_results": 5}
        if detected:
            query_kwargs["where"] = {"program": detected}
        results = faq_collection.query(**query_kwargs)
        if not results["documents"] or not results["documents"][0]:
            return "No relevant FAQ information found for that query."
        docs = results["documents"][0]
        metadatas = results["metadatas"][0]
        output_parts = []
        for doc, meta in zip(docs, metadatas):
            output_parts.append(
                f"[{meta.get('full_name', '')} - {meta.get('section', '')}]\n{doc}"
            )
        return "\n\n---\n\n".join(output_parts)

    elif action == "GET_PROGRAM_DETAILS":
        program_code = action_input.strip().upper()
        normalized = _normalize_program_code(program_code, programs)
        # Track that this program was viewed
        if normalized not in state.lead.programs_viewed:
            state.lead.programs_viewed.append(normalized)
        results = faq_collection.query(
            query_texts=[f"Program details for {program_code}"],
            n_results=5,
            where={"program": normalized},
        )
        if not results["documents"] or not results["documents"][0]:
            available = ", ".join(p["program"] for p in programs)
            return f"No program found matching '{action_input}'. Available programs: {available}"
        return "\n\n".join(results["documents"][0])

    elif action == "COMPARE_PROGRAMS":
        parts = [p.strip().upper() for p in action_input.split(",")]
        if len(parts) < 2:
            return "Please provide two program codes separated by comma, e.g. 'CNA, EKG'"
        comparisons = []
        for code in parts[:2]:
            normalized = _normalize_program_code(code, programs)
            if normalized not in state.lead.programs_viewed:
                state.lead.programs_viewed.append(normalized)
            results = faq_collection.query(
                query_texts=[f"Full summary of {code} program"],
                n_results=3,
                where={"program": normalized},
            )
            if results["documents"] and results["documents"][0]:
                comparisons.append(f"=== {code} ===\n" + "\n".join(results["documents"][0]))
            else:
                comparisons.append(f"=== {code} ===\nNo information found.")
        return "\n\n".join(comparisons)

    elif action == "GET_PRICING":
        program_code = action_input.strip().upper()
        normalized = _normalize_program_code(program_code, programs)
        if normalized not in state.lead.programs_viewed:
            state.lead.programs_viewed.append(normalized)
        results = faq_collection.query(
            query_texts=[f"tuition cost price fee for {program_code}"],
            n_results=3,
            where={"program": normalized},
        )
        if not results["documents"] or not results["documents"][0]:
            return f"No pricing information found for '{action_input}'."
        return "\n\n".join(results["documents"][0])

    elif action == "GET_REQUIREMENTS":
        program_code = action_input.strip().upper()
        normalized = _normalize_program_code(program_code, programs)
        if normalized not in state.lead.programs_viewed:
            state.lead.programs_viewed.append(normalized)
        results = faq_collection.query(
            query_texts=[f"requirements prerequisites admission for {program_code}"],
            n_results=3,
            where={"program": normalized},
        )
        if not results["documents"] or not results["documents"][0]:
            return f"No requirements information found for '{action_input}'."
        return "\n\n".join(results["documents"][0])

    elif action == "COLLECT_INFO":
        # Parse key=value pairs from action input
        # Format: "name=John Doe" or "phone=555-1234" or "email=john@email.com" or "program=CNA"
        try:
            pairs = _parse_key_value(action_input)
            collected = []
            for key, value in pairs.items():
                key_lower = key.lower().strip()
                if key_lower == "name":
                    state.lead.name = value
                    collected.append(f"name: {value}")
                elif key_lower == "phone":
                    state.lead.phone = value
                    collected.append(f"phone: {value}")
                elif key_lower == "email":
                    state.lead.email = value
                    collected.append(f"email: {value}")
                elif key_lower in ("program", "program_interest", "interest"):
                    state.lead.program_interest = value
                    collected.append(f"program interest: {value}")
            if collected:
                return f"Saved student info: {', '.join(collected)}"
            return "Could not parse any info. Use format: name=John Doe, phone=555-1234"
        except Exception as e:
            return f"Error saving info: {e}. Use format: name=John Doe, phone=555-1234"

    elif action == "NAVIGATE":
        # Direct the user to a specific page
        page_key = action_input.strip().lower()
        page = PAGE_MAP.get(page_key)
        if not page:
            # Try partial match
            for key, val in PAGE_MAP.items():
                if page_key in key or key in page_key:
                    page = val
                    break
        if page:
            state.navigate_to = page
            if page not in state.lead.pages_suggested:
                state.lead.pages_suggested.append(page)
            return f"Navigation set to {page}. The frontend will direct the user to this page."
        available = ", ".join(sorted(set(PAGE_MAP.keys())))
        return f"Unknown page '{action_input}'. Available pages: {available}"

    elif action == "FINISH":
        state.answer = action_input
        state.done = True
        return "Done."

    else:
        return (
            f"Unknown action: {action}. "
            "Use one of: SEARCH_FAQ, GET_PROGRAM_DETAILS, COMPARE_PROGRAMS, "
            "GET_PRICING, GET_REQUIREMENTS, COLLECT_INFO, NAVIGATE, FINISH"
        )


def _normalize_program_code(code, programs):
    """Try to match a user-provided program code to one in our program list."""
    code = code.strip().upper()
    for p in programs:
        if p["program"].upper() == code:
            return p["program"]
    for p in programs:
        if code in p["program"].upper() or code in p["full_name"].upper():
            return p["program"]
    return code


def _detect_program_in_query(query, programs):
    """Check if the user's query mentions a specific program and return its code."""
    query_upper = query.upper()
    # Check exact short codes first (longer codes first to avoid partial matches)
    sorted_programs = sorted(programs, key=lambda p: len(p["program"]), reverse=True)
    for p in sorted_programs:
        code = p["program"].upper()
        full = p["full_name"].upper()
        # Check for the code as a whole word
        if f" {code} " in f" {query_upper} " or query_upper.startswith(code + " ") or query_upper.endswith(" " + code) or query_upper == code:
            return p["program"]
        if full in query_upper:
            return p["program"]
    return None


def _parse_key_value(text):
    """Parse 'key=value, key2=value2' into a dict."""
    pairs = {}
    parts = text.split(",")
    for part in parts:
        if "=" in part:
            key, value = part.split("=", 1)
            pairs[key.strip()] = value.strip()
    return pairs
