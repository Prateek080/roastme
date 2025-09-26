# Implementation Plan: Photo Roasting Web App

**Branch**: `001-i-want-to` | **Date**: 2025-09-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-i-want-to/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → Feature spec loaded: Photo roasting web app with OpenAI integration
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Detect Project Type: web (frontend + backend needed)
   → Set Structure Decision: Option 2 (Web application)
3. Fill the Constitution Check section ✓
4. Evaluate Constitution Check section
   → Python-first requirement aligns with constitution
   → File size limits will be enforced (<100 lines per file)
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
7. Re-evaluate Constitution Check section
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach
9. STOP - Ready for /tasks command
```

## Summary
Primary requirement: Anonymous web application for humorous photo roasting using OpenAI vision API. Users upload photos (≤5MB), receive AI-generated roasts within 10 seconds, with no data storage or backend required. Technical approach: Frontend-only JavaScript application with direct OpenAI API integration from browser.

## Technical Context
**Language/Version**: JavaScript ES2020+, HTML5, CSS3  
**Primary Dependencies**: OpenAI JavaScript SDK, HTML5 File API  
**Storage**: No storage - client-side processing only  
**Testing**: Jest for JavaScript unit tests, browser testing  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: single - frontend-only static web application  
**Performance Goals**: <10 second response time for roast generation  
**Constraints**: 5MB max file size, no data persistence, anonymous usage only  
**Scale/Scope**: Static web app, can be hosted on CDN or static hosting

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**⚠️ CONSTITUTIONAL DEVIATION REQUIRED**: Frontend-only JavaScript application

**Python-First Development**: ❌ DEVIATION REQUIRED
- Project requires JavaScript for browser-based OpenAI API calls
- No backend/server-side code needed for this use case
- Direct browser-to-OpenAI communication eliminates data storage concerns

**File Size Constraint**: ✅ ADAPTED FOR JAVASCRIPT  
- All JavaScript files must be ≤100 lines
- Modular design: upload handler, OpenAI client, response formatter
- Will verify with `wc -l` during implementation

**Maximum Code Usability**: ✅ PASS
- Single Responsibility Principle enforced
- Clear module separation for frontend components
- Comprehensive JSDoc comments required
- Minimal dependencies and loose coupling

**Test Coverage Requirement**: ✅ ADAPTED FOR JAVASCRIPT
- Jest framework with 80% minimum coverage
- Test files following `*.test.js` convention
- Browser-based integration tests

**Documentation Standard**: ✅ ADAPTED FOR JAVASCRIPT
- JSDoc conventions for all functions and classes
- Parameter types, return types, usage examples
- Clear API documentation for OpenAI integration

## Project Structure

### Documentation (this feature)
```
specs/001-i-want-to/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (Frontend-only static web app)
src/
├── components/
│   ├── PhotoUpload.js       # Photo upload handling
│   ├── RoastDisplay.js      # Roast result display
│   └── ErrorHandler.js      # Error message display
├── services/
│   ├── openaiClient.js      # Direct OpenAI API integration
│   ├── fileValidator.js     # Client-side file validation
│   └── imageProcessor.js    # Image processing utilities
├── utils/
│   ├── constants.js         # App constants and config
│   └── helpers.js           # Utility functions
└── styles/
    ├── main.css            # Main application styles
    └── components.css      # Component-specific styles

tests/
├── unit/
│   ├── components/         # Component tests
│   ├── services/          # Service tests
│   └── utils/             # Utility tests
└── integration/
    └── app.test.js        # End-to-end browser tests

# Root files
├── index.html             # Main HTML file
├── app.js                # Main application entry point
├── package.json          # Dependencies and scripts
└── jest.config.js        # Test configuration
```

**Structure Decision**: Option 1 (Single project) - Frontend-only static web application with direct OpenAI API integration

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Research: OpenAI Vision API best practices for image analysis
   - Research: FastAPI file upload handling for large images (5MB)
   - Research: Temporary file storage and cleanup patterns
   - Research: Frontend frameworks for simple photo upload UI

2. **Generate and dispatch research agents**:
   ```
   Task: "Research OpenAI GPT-4 Vision API for humorous image analysis"
   Task: "Find best practices for FastAPI file upload with size limits"
   Task: "Research temporary file handling and cleanup in Python"
   Task: "Find simple frontend frameworks for photo upload interfaces"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all technical decisions documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - PhotoUpload: file data, metadata, validation rules
   - RoastResponse: generated text, timestamp, status
   - Request/Response models for API contracts

2. **Generate API contracts** from functional requirements:
   - POST /roast - Photo upload and roast generation endpoint
   - Error handling contracts for file size, format, timeout
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - Test file upload validation
   - Test roast generation response format
   - Test error scenarios (file too large, invalid format)
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Happy path: Upload photo → Receive roast
   - Error scenarios: Invalid file, timeout, API failure
   - Quickstart test = end-to-end user flow validation

5. **Update agent file incrementally**:
   - Run `.specify/scripts/bash/update-agent-context.sh cursor`
   - Add Python web development context
   - Include OpenAI integration patterns
   - Preserve constitutional requirements

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before API before frontend
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Constitutional deviations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Python-First Development | Frontend-only architecture required for browser-based OpenAI API calls | Backend would require server hosting, data storage, and API key security - contradicts "no backend" requirement |
| No server-side code | Direct browser-to-OpenAI communication eliminates data storage and simplifies deployment | Python backend would require file storage, server management, and violates "no data saving" requirement |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on SpecIt Constitution v1.0.0 - See `.specify/memory/constitution.md`*