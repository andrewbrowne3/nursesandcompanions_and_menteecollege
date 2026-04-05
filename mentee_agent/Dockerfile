FROM python:3.11-slim

WORKDIR /app

COPY mentee_agent/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY mentee_agent/ /app/mentee_agent/
COPY MenteeCollege/ /app/MenteeCollege/

ENV PYTHONPATH=/app

CMD ["python", "-m", "mentee_agent.main"]
