---
id: "000"
title: Bootstrap local task tracker
status: done
area: meta
priority: normal
started: 2026-05-13
finished: 2026-05-13
---

## Description

Set up a local, file-backed task tracker that AI tools (Claude Code) can manage and a human can review. Goal: lightweight Jira-alternative — markdown source of truth, HTML viewer, no server, no cloud. Mirrors the system already in use in the `echoofabyss` project.

## Work log

- 2026-05-13: ported `build_tasks_html.py`, `/task-start`, `/task-done`, and the PostToolUse hook from the echoofabyss project.

## Summary

Tracker is live. Schema: `id`, `title`, `status` (active/backlog/done), `area`, `priority`, `started`, `finished` in frontmatter; body has `## Description`, `## Work log`, `## Summary`. Use `/task-start <title>` to open, `/task-done <id>` to close. Open `tasks/tasks.html` in a browser to review — it refreshes automatically whenever any task markdown file is edited.
