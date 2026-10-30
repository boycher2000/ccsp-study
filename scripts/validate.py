#!/usr/bin/env python3
"""Validate CCSP study data: outline, notes and question bank.

Usage: python scripts/validate.py
Exit code 1 if any error is found. Prints a coverage report either way.
"""
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "docs" / "data"
TARGET_TOTAL = 1000
REQUIRED = ["id", "domain", "topic", "difficulty", "status", "stem", "options", "answer", "explain", "why"]
STATUSES = {"draft", "reviewed", "verified"}

MIN_NOTE_CHARS = 1200
REQUIRED_HEADINGS = ["### 白話重點", "### 名詞解釋", "### 考點"]
note_chars = {}

errors, warnings = [], []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def main():
    outline = json.loads((DATA / "outline.json").read_text(encoding="utf-8"))
    topics = {}
    weights = {}
    for d in outline["domains"]:
        weights[d["id"]] = d["weight"]
        for t in d["topics"]:
            topics[t["id"]] = d["id"]
    if sum(weights.values()) != 100:
        err(f"domain weights sum to {sum(weights.values())}, expected 100")
    if len(topics) != 38:
        err(f"outline has {len(topics)} topics, expected 38")

    # notes: every topic needs a section in its domain file
    for d in outline["domains"]:
        path = DATA / "notes" / f"d{d['id']}.md"
        if not path.exists():
            err(f"missing notes file {path.name}")
            continue
        text = path.read_text(encoding="utf-8")
        sections = {}
        for m in re.finditer(r"^## (\d\.\d)\s.*?(?=^## \d\.\d\s|\Z)", text, re.M | re.S):
            sections[m.group(1)] = m.group(0)
        for t in d["topics"]:
            sec = sections.get(t["id"])
            if sec is None:
                err(f"no note section for topic {t['id']}")
                continue
            note_chars[t["id"]] = len(sec)
            if len(sec) < MIN_NOTE_CHARS:
                warn(f"note {t['id']} is short ({len(sec)} chars, want >= {MIN_NOTE_CHARS})")
            cm = re.search(r"<!--\s*covers:\s*([\d,\s]+)-->", sec)
            if not cm:
                err(f"note {t['id']}: missing '<!-- covers: 1,2,... -->' line")
            else:
                covered = {int(x) for x in re.findall(r"\d+", cm.group(1))}
                want = set(range(1, len(t["bullets"]) + 1))
                if covered != want:
                    miss = sorted(want - covered)
                    extra = sorted(covered - want)
                    err(f"note {t['id']}: covers marker mismatch (missing {miss}, unknown {extra})")
            for need in REQUIRED_HEADINGS:
                if need not in sec:
                    warn(f"note {t['id']}: missing section '{need}'")
        for extra in set(sections) - {t["id"] for t in d["topics"]}:
            err(f"note section {extra} is not in outline domain {d['id']}")

    # questions
    seen = set()
    per_topic = Counter()
    per_domain = Counter()
    status_count = Counter()
    for path in sorted((DATA / "questions").glob("d*.json")):
        try:
            qs = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            err(f"{path.name}: invalid JSON: {e}")
            continue
        for q in qs:
            qid = q.get("id", "<no id>")
            for k in REQUIRED:
                if k not in q:
                    err(f"{qid}: missing field '{k}'")
            if "id" not in q:
                continue
            if qid in seen:
                err(f"{qid}: duplicate id")
            seen.add(qid)
            if q.get("topic") not in topics:
                err(f"{qid}: unknown topic {q.get('topic')}")
                continue
            if topics[q["topic"]] != q.get("domain"):
                err(f"{qid}: domain {q.get('domain')} does not match topic {q['topic']}")
            if not qid.startswith(f"D{q.get('domain')}-{q['topic']}-"):
                warn(f"{qid}: id does not follow D<domain>-<topic>-<nnn>")
            if path.name != f"d{q.get('domain')}.json":
                err(f"{qid}: stored in {path.name} but domain is {q.get('domain')}")
            opts = q.get("options", [])
            if len(opts) != 4:
                err(f"{qid}: expected 4 options, got {len(opts)}")
            if len(set(opts)) != len(opts):
                err(f"{qid}: duplicate options")
            if not isinstance(q.get("answer"), int) or not 0 <= q["answer"] < len(opts):
                err(f"{qid}: answer index out of range")
            if len(q.get("why", [])) != len(opts):
                err(f"{qid}: 'why' must have one entry per option")
            if q.get("difficulty") not in (1, 2, 3):
                err(f"{qid}: difficulty must be 1, 2 or 3")
            if q.get("status") not in STATUSES:
                err(f"{qid}: status must be one of {sorted(STATUSES)}")
            if q.get("status") == "verified" and not q.get("source"):
                err(f"{qid}: verified questions need at least one source")
            per_topic[q["topic"]] += 1
            per_domain[q["domain"]] += 1
            status_count[q.get("status")] += 1

    if (DATA / "notes" / "overview.md").exists() is False:
        warn("notes/overview.md is missing")
    if note_chars:
        print(f"Notes: {len(note_chars)}/38 topics, {sum(note_chars.values())} chars total, "
              f"shortest {min(note_chars.values())}, longest {max(note_chars.values())}")

    total = sum(per_domain.values())
    print(f"Questions: {total} / {TARGET_TOTAL} target   status: {dict(status_count)}")
    print("Domain  weight  have  target")
    for d in sorted(weights):
        target = round(TARGET_TOTAL * weights[d] / 100)
        print(f"  D{d}     {weights[d]:>3}%   {per_domain[d]:>4}  {target:>5}")
    missing = [t for t in topics if per_topic[t] == 0]
    if missing:
        warn(f"topics without questions: {', '.join(missing)}")

    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print(f"{len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
