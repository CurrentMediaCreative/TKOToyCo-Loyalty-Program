# TKO Toy Co Loyalty Program - Task Workflow

## Task Context Management Workflow

This document outlines the proper workflow for task transitions and context management in the TKO Toy Co Loyalty Program project.

### Task Initialization Sequence

1. **Read .clinerules First**

   - **ALWAYS** read the `.clinerules` file as the very first step when starting a new task
   - This file contains critical instructions for task management, context preservation, and project standards
   - The rules in this file take precedence over other documentation

2. **Read ALL Memory Bank Files**

   - After reading `.clinerules`, read ALL memory bank files in the following order:
     1. `projectbrief.md` - Core requirements and project scope
     2. `productContext.md` - Business context and user experience goals
     3. `systemPatterns.md` - Architecture and design patterns
     4. `techContext.md` - Technology stack and constraints
     5. `activeContext.md` - Current work focus and recent changes
     6. `progress.md` - Project status and known issues
     7. `taskWorkflow.md` - This file, for task management procedures

3. **Assess Current Context**
   - Review the current project state
   - Understand recent code changes
   - Note architectural decisions
   - Identify implementation patterns
   - Be aware of outstanding issues

### Context Window Management

1. **Monitor Context Usage**

   - Regularly check context usage percentage in environment details
   - Context window usage is displayed at the bottom of each environment details section

2. **Create New Task Contexts At**:

   - Logical boundaries between work phases
   - When context usage exceeds 70-80%
   - After completing a major milestone
   - When switching to a significantly different area of the project

3. **Before Creating New Task**:
   - Update relevant memory bank files, especially `activeContext.md` and `progress.md`
   - Ensure all important context is captured in memory bank files
   - Summarize completed work and pending items

### Task Transition Process

1. **Update Memory Bank Files**

   - Update `activeContext.md` with current focus, recent changes, and next steps
   - Update `progress.md` with completed tasks and upcoming work
   - Document any new patterns in `systemPatterns.md`
   - Update other relevant memory bank files as needed

2. **Create New Task Context**

   - Use the `new_task` tool to create a new task with proper context
   - Include comprehensive context covering:
     - Current work status
     - Key technical concepts
     - Relevant files and code
     - Problem-solving approaches
     - Pending tasks and next steps

3. **Verify Context Preservation**
   - Ensure the new task has all necessary context
   - Confirm memory bank files are up-to-date
   - Check that important decisions and patterns are documented

## Task Completion Criteria

1. **Verification Steps**:

   - Code runs without errors
   - Tests pass
   - Documentation is updated
   - User confirms acceptance

2. **Handoff Process**:
   - Summarize completed work
   - Document any known issues
   - Provide clear next steps
   - Update memory bank files

## IMPORTANT REMINDER

**ALWAYS read .clinerules first, followed by ALL memory bank files at the start of EVERY task.**

This workflow ensures consistent context management across all tasks and instances, preventing knowledge loss between sessions.
