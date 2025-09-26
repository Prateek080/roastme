# SpecIt Constitution

## Core Principles

### I. Python-First Development
All code must be written in Python 3.9+ with strict adherence to PEP 8 style guidelines. Type hints are mandatory for all functions and class methods. Use `black` for code formatting and `pylint` for code quality checks.

### II. File Size Constraint (NON-NEGOTIABLE)
No Python file shall exceed 100 lines of code. This includes comments and docstrings. If a file approaches this limit, it must be refactored into smaller, focused modules. Use `wc -l` to verify compliance.

### III. Maximum Code Usability
Code must be designed for maximum reusability and maintainability:
- Single Responsibility Principle: Each function/class does one thing well
- Clear, descriptive naming that explains intent
- Comprehensive docstrings for all public functions and classes
- Minimal dependencies and loose coupling between modules

### IV. Test Coverage Requirement
Every Python module must have corresponding tests with minimum 80% code coverage. Tests must be in separate files following the `test_*.py` naming convention. Use `pytest` for testing framework.

### V. Documentation Standard
All functions and classes must include docstrings following Google or NumPy docstring conventions. Include parameter types, return types, and usage examples for public APIs.

## Development Standards

### Code Quality Gates
- All code must pass `black --check`, `pylint`, and `mypy` validation
- No `TODO` or `FIXME` comments allowed in main branch
- Maximum cyclomatic complexity of 10 per function
- All imports must be sorted using `isort`

### Performance Requirements
- Functions should complete within 100ms for typical use cases
- Memory usage should be minimal and predictable
- No global state or mutable defaults in function parameters

## Code Review Process

### Mandatory Checks
- File size verification: `wc -l *.py` must show ≤100 lines per file
- Test coverage: `pytest --cov` must show ≥80% coverage
- Type checking: `mypy` must pass with no errors
- Code usability review: Ensure code can be easily imported and reused

## Governance

### Constitution Authority
This constitution supersedes all other coding practices and guidelines. All code contributions must comply with these rules before merging to main branch.

### Compliance Enforcement
- Pre-commit hooks must enforce file size limits and code quality
- CI/CD pipeline must validate all constitution requirements
- Code reviews must explicitly verify compliance with usability principles
- Any violations must be addressed before code acceptance

### Amendment Process
Constitutional changes require:
1. Documentation of proposed changes with rationale
2. Impact assessment on existing codebase
3. Migration plan for non-compliant code
4. Unanimous approval from core maintainers

**Version**: 1.0.0 | **Ratified**: 2025-09-18 | **Last Amended**: 2025-09-18