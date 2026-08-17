MASTER BUILD PROMPT
GHBC — Ghana Building Compliance Intelligence Platform
Production MVP at https://ghbc.gabochie.com
1. ROLE

You are a senior product architect, SaaS engineer, AI/RAG engineer, AEC technology specialist, building-code information architect, UX designer and DevOps engineer.

Your mission is to design and implement a production-ready MVP called:

GHBC
Ghana Building Compliance Intelligence

Primary domain:

https://ghbc.gabochie.com

Brand positioning:

The AI-powered compliance intelligence layer for building design and construction in Ghana.

The product must transform Ghana's fragmented building regulations, standards, code requirements, planning requirements and professional compliance information into a searchable, explainable, project-aware digital compliance system.

This is NOT simply a chatbot.

It is a:

Regulatory knowledge platform
AI building-code copilot
Structured requirements database
Rules engine
Project compliance workspace
Compliance checklist generator
Regulatory document intelligence system
Future API platform for AEC software and AI agents
2. IMPORTANT LEGAL / CONTENT RULE

Do NOT blindly reproduce or redistribute copyrighted versions of Ghana Standards Authority material.

Treat GS 1207:2018 and other standards as controlled regulatory source material.

The system must support:

licensed/authorized source documents
legally obtained customer-provided documents
official public regulatory material
government legislation
public planning documents
official assembly publications
properly attributed summaries and extracted rules

Every regulatory statement must preserve provenance.

Never invent a building-code requirement.

Never present an AI-generated interpretation as an official legal ruling.

Every answer should distinguish:

SOURCE REQUIREMENT

What the source actually says.

INTERPRETATION

How GHBC interprets the requirement.

PROJECT APPLICATION

How the requirement appears to apply to the user's project.

PROFESSIONAL REVIEW

What must be verified by an appropriately qualified professional or authority.

3. PRIMARY PRODUCT OBJECTIVE

A user should be able to create a project and answer:

What type of building is this?
Where is it located?
What is the occupancy/use?
How many floors?
Approximate building height?
Gross floor area?
Site area?
Number of occupants?
Is it new construction, alteration or existing?
What structural system is proposed?
What special risks exist?
What authority will review the project?

GHBC should then construct a:

PROJECT COMPLIANCE PROFILE

and dynamically determine the regulatory requirements relevant to that project.

4. INITIAL TARGET USERS

Design the architecture for:

Primary users
Architects
Architectural practices
Architectural students
Engineers
Quantity surveyors
Contractors
Developers
Building owners
Planning consultants
Building control officers
Fire-safety professionals
MEP professionals
Property professionals
Secondary future users
Banks
Insurance companies
Developers
Real-estate platforms
PropTech companies
Government agencies
Local assemblies
Construction companies
AI agents
BIM software companies
5. CORE PRODUCT MODULES

Build the MVP around these modules.

MODULE A — GHBC AI COPILOT

A conversational interface.

Example:

"For a three-storey residential apartment building in Accra, what compliance issues should I check before submitting drawings?"

The system must:

identify the project context
retrieve relevant regulatory sources
identify applicable requirements
cite the source
explain the requirement
identify uncertainty
recommend next actions

Never answer from generic LLM knowledge when a regulatory source is available.

6. MODULE B — CODE EXPLORER

Create a structured browser for the Ghana Building Code.

Use the known 38-part structure of GS 1207:2018 as the initial taxonomy.

Major sections include:

Scope and Administration
Definitions
Occupancy Classification and Use
Special Detailed Requirements
Site Development and Land Use
General Building Heights and Areas
Types of Construction
Fire and Smoke Protection
Interior Finishes
Fire Protection and Life Safety
Means of Escape
Accessibility
Interior Environment
Energy Efficiency and Sustainability
Exterior Walls
Roof Assemblies
Structural Loads and Design
Soils and Foundations
Special Inspections and Tests
Concrete Works
Aluminium
Masonry
Steel
Wood, Bamboo and Rattan
Glass and Glazing
Gypsum Board and Plaster
Plastics
Electrical Systems
Mechanical Systems
Plumbing Systems
Lift and Conveying Systems
Special Construction
Encroachments into Public Right-of-Way
Safeguards During Construction
Small Buildings
Existing Buildings
Green Building Requirements
Referenced Standards

Also support appendices and referenced standards.

7. MODULE C — REGULATORY SOURCE LIBRARY

Create a source hierarchy.

Tier 1 — Primary authority
Ghana Standards Authority
Government of Ghana
Ministry responsible for Works/Housing
Ghanaian legislation
official regulatory agencies
official local assemblies
Tier 2 — Professional authorities
Architects Registration Council
Ghana Institution of Engineers
Ghana National Fire Service
relevant professional bodies
Tier 3 — Local authority sources

Support individual assemblies.

Examples:

Accra Metropolitan Assembly
municipal assemblies
metropolitan assemblies
district assemblies

Each authority should have its own regulatory profile.

8. REGULATORY DOCUMENT MODEL

Create database entities:

Regulation

Fields:

id
title
authority
document_type
jurisdiction
publication_date
effective_date
version
status
source_url
source_document
copyright_status
license_status
supersedes
superseded_by
Requirement

Fields:

requirement_id
source_id
section
subsection
title
requirement_text
normalized_requirement
requirement_type
applicability_conditions
exceptions
numerical_parameters
units
dependencies
related_requirements
confidence
effective_date
Authority

Fields:

authority_id
name
jurisdiction
authority_type
website
permit_role
contact_information
Referenced Standard

Fields:

standard_id
standard_number
title
issuing_body
status
relationship_to_requirement
9. REQUIREMENT TYPES

Classify requirements as:

mandatory
prohibited
conditional
recommended
informational
procedural
documentation
inspection
approval
calculation
dimensional
performance-based

This distinction is critical.

Do not treat a recommendation as a mandatory requirement.

10. RULE ENGINE

Create a deterministic compliance engine separate from the LLM.

The LLM must NOT be the final calculator.

Create rules such as:

IF:

occupancy = residential

AND:

building_height > threshold

THEN:

activate relevant fire/life-safety requirements.

Another rule may be:

IF:

building_type = public

THEN:

activate accessibility requirements.

The actual thresholds and conditions must be populated ONLY from verified source material.

Store every rule with:

rule_id
source_reference
condition
input_variables
calculation
output
severity
explanation
effective_date
11. PROJECT COMPLIANCE PROFILE

Create a project wizard.

Step 1

Project name

Step 2

Location

region
district
municipality
assembly
Step 3

Project type

new construction
renovation
extension
change of use
existing building
demolition
Step 4

Occupancy

Step 5

Building characteristics

floors
height
floor area
site area
basement
roof type
structural system
Step 6

Occupancy load

Step 7

Special conditions

flood risk
coastal environment
steep site
hazardous use
public assembly
healthcare
education
industrial
high-rise
mixed use
Step 8

Project professionals

architect
structural engineer
MEP engineer
QS
fire consultant
geotechnical engineer
environmental consultant

Generate the project compliance matrix.

12. COMPLIANCE MATRIX

Display:

Requirement	Applicable?	Status	Source	Responsible Professional	Evidence

Statuses:

PASS
FAIL
REVIEW
NOT APPLICABLE
MISSING INFORMATION
NOT VERIFIED

Never call something PASS merely because the AI assumes it is compliant.

13. AI COMPLIANCE REVIEW

Allow users to upload legally obtained project material such as:

PDF drawings
specifications
reports
schedules
project descriptions
calculations
checklists

The AI should extract:

dimensions
occupancy
room types
floor counts
stairs
exits
accessibility features
fire features
parking information
sanitary facilities
structural information
MEP information

Then compare extracted project information against applicable requirements.

14. DRAWING REVIEW — MVP

Do NOT attempt full BIM model checking in V1.

Implement a document/image review pipeline.

For example:

USER:

uploads floor plan PDF.

GHBC:

OCR
identify rooms
identify dimensions where possible
identify doors
identify stairs
identify circulation
identify sanitary facilities
identify potential exits
compare against applicable requirements
produce REVIEW findings

Every finding must contain:

issue
severity
confidence
source
reason
recommended action

Example:

REVIEW — Stair geometry may require verification against applicable requirements.

Do not fabricate measurements that cannot be reliably extracted.

15. COMPLIANCE SEVERITY

Use:

CRITICAL

Potential life-safety or major regulatory issue.

HIGH

Likely significant compliance issue.

MEDIUM

Requires design correction or professional review.

LOW

Documentation/detail improvement.

INFORMATION

Useful guidance.

16. PERMIT READINESS CHECKER

Create:

"Am I ready to submit?"

The system generates a project-specific submission checklist.

Categories:

Land/title
title documentation
search documentation
Architecture
site plan
block plan
floor plans
elevations
sections
schedules
Structure
structural drawings
calculations
soil/geotechnical documentation
Fire
fire report
fire drawings where applicable
MEP
electrical
mechanical
plumbing
Environment
EPA requirements where applicable
Planning
zoning
planning scheme
local assembly requirements
Professional
required professional signatures/seals

The checklist must be authority-specific because local assemblies may publish different requirements.

17. ASSEMBLY INTELLIGENCE

This is a major differentiator.

Create:

Ghana Permit Intelligence

User chooses:

Accra Metropolitan Assembly

or another assembly.

GHBC then shows:

relevant authority
local permit requirements
published checklist
local planning requirements
required documents
process
published fees if available
official source
last verified date

Never assume every assembly has identical requirements.

18. SOURCE CITATION ENGINE

Every AI answer must provide:

Source

Document:

GS 1207:2018

Part:

Part XX

Section:

X.X.X

Authority:

Ghana Standards Authority

Source status:

Verified / Needs verification

Add:

GHBC interpretation — not an official determination by the issuing authority.

If the answer relies on multiple sources, show all of them.

19. RAG ARCHITECTURE

Implement retrieval-augmented generation.

Pipeline:

USER QUESTION

↓

Project Context

↓

Query Classification

↓

Regulatory Retrieval

↓

Requirement Extraction

↓

Rules Engine

↓

LLM Reasoning

↓

Source Verification

↓

Answer

↓

Citations

The LLM must never be allowed to silently substitute general architectural knowledge for a missing regulation.

If no reliable source is found:

"I could not verify this requirement from the available GHBC source library."

20. HYBRID AI ARCHITECTURE

Use three layers.

Layer 1 — Deterministic Rules

For:

calculations
thresholds
dimensions
conditions
checklists
compliance states
Layer 2 — Retrieval

For:

regulatory text
definitions
explanations
source relationships
Layer 3 — LLM

For:

natural-language explanation
contextual reasoning
project recommendations
summarization
conversational interaction

This separation is mandatory.

21. RECOMMENDED TECH STACK

Build the MVP as a modern web SaaS.

Frontend

Next.js

TypeScript

Tailwind CSS

shadcn/ui

Responsive desktop-first architecture.

Backend

Python FastAPI

PostgreSQL

Redis

Background workers

AI

Provider abstraction layer supporting:

OpenAI-compatible APIs
OpenRouter-compatible APIs
local models
future enterprise models

Never hard-code one AI provider.

Vector database

Prefer PostgreSQL + pgvector initially.

Do not introduce unnecessary infrastructure.

Document processing

Support:

PDF extraction
OCR
structured chunking
metadata extraction
table extraction
Authentication

Email/password initially.

Architect for:

Google
Microsoft
enterprise SSO

later.

Storage

S3-compatible object storage.

Store:

uploaded documents
processed documents
project files
reports
22. SOFTWARE-AGNOSTIC ARCHITECTURE

The regulatory intelligence engine must be independent from the UI.

Expose internal APIs:

/api/v1/projects

/api/v1/requirements

/api/v1/regulations

/api/v1/compliance

/api/v1/checklists

/api/v1/search

/api/v1/chat

/api/v1/documents

/api/v1/authorities

/api/v1/rules

This allows future integration with:

Archicad
Revit
AutoCAD
Rhino
IFC/BIM
construction software
AI agents
WordPress
mobile applications
23. FUTURE AGENT API

Design the system from day one so AI agents can query it.

Example:

POST:

/api/v1/agent/compliance-check

Input:

{
  "project_type": "residential",
  "location": "Accra",
  "storeys": 3,
  "floor_area": 1200,
  "occupancy": "residential"
}

Output:

{
  "status": "review_required",
  "applicable_requirements": [],
  "issues": [],
  "missing_information": [],
  "sources": [],
  "confidence": 0.91
}

Future agents should be able to ask:

"What Ghanaian requirements apply to this building?"

and receive machine-readable results.

24. AGENT-NATIVE DESIGN

Eventually GHBC should become:

"The compliance API for AI agents designing buildings in Ghana."

Expose capabilities such as:

get_applicable_requirements

classify_occupancy

check_fire_requirements

check_accessibility

check_means_of_escape

check_site_requirements

check_documentation

check_permit_readiness

find_authority_requirements

get_requirement_source

explain_requirement

generate_compliance_report

25. USER DASHBOARD

Dashboard should show:

Projects

Each project card:

project name
location
project type
compliance score
open issues
missing documents
last reviewed
Compliance Score

Do NOT market the score as legal compliance certification.

Call it:

GHBC Readiness Score

Example:

78% — Review Required

Breakdown:

Architecture
Fire/Life Safety
Accessibility
Structural
MEP
Planning
Documentation
26. REPORT GENERATOR

Generate professional PDF reports.

Report:

GHBC PROJECT COMPLIANCE REVIEW

Include:

project information
date
regulatory sources
assumptions
project inputs
compliance matrix
findings
missing information
recommendations
source references
professional review warnings

Include:

This report is an AI-assisted preliminary compliance review and does not constitute approval, certification, professional sign-off, or a determination by a Ghanaian regulatory authority.

27. ADMIN DASHBOARD

Create /admin.

Features:

source management
document ingestion
requirement extraction
requirement approval
rule management
authority management
version management
source verification
audit logs

Every regulatory requirement must have an editorial state:

DRAFT

REVIEW

VERIFIED

SUPERSEDED

REJECTED

Only VERIFIED requirements should power production compliance results.

28. REGULATORY VERSION CONTROL

This is critical.

Every source must have:

version
effective date
publication date
jurisdiction
status

Never overwrite an old requirement.

Instead:

VERSION 1

↓

SUPERSEDED BY

VERSION 2

The system must be able to answer:

"What requirement was applicable at the time this project was designed?"

29. KNOWLEDGE GRAPH

Build relationships between:

Regulation

↓

Part

↓

Section

↓

Requirement

↓

Condition

↓

Rule

↓

Project characteristic

↓

Compliance finding

↓

Professional responsibility

↓

Authority

This creates a regulatory knowledge graph.

30. SEARCH

Implement hybrid search:

keyword search
semantic search
metadata filtering
exact section lookup
natural-language questions

Example:

"minimum stair requirements"

should return relevant requirements, not merely documents containing the word "stair."

31. UX

The interface should feel like:

Bloomberg Terminal + Notion + Autodesk + modern AI assistant

but much simpler.

Primary navigation:

Dashboard
Projects
Code Explorer
Compliance
Permit Readiness
Authorities
Documents
AI Copilot
Reports
API
Account

Primary CTA:

"Check My Project"
32. LANDING PAGE

Hero:

Ghana Building Compliance, Powered by AI.

Subheadline:

Understand the requirements. Check your project. Find what's missing. Build with greater confidence.

CTA:

Check a Project

Secondary:

Explore Ghana Building Code

Feature blocks:

Ask

Ask questions about Ghanaian building requirements.

Check

Compare project information against applicable requirements.

Prepare

Generate project-specific compliance and permit-readiness checklists.

Verify

Trace every answer back to its regulatory source.

33. MONETIZATION

Implement SaaS architecture.

FREE

Limited:

code search
limited AI questions
basic project
basic checklist
PROFESSIONAL

For architects and consultants.

Features:

multiple projects
AI copilot
compliance reviews
document uploads
reports
project history
STUDIO

For practices.

Features:

team members
shared projects
project templates
advanced compliance
authority intelligence
API access
ENTERPRISE

For:

developers
banks
insurers
construction companies
government
large professional firms

Features:

API
custom knowledge base
SSO
audit logs
dedicated deployment
enterprise support
34. FUTURE API MONETIZATION

Create:

GHBC API

Possible pricing model:

Free developer tier

↓

Usage-based API

↓

Professional API

↓

Enterprise API

Potential API metrics:

regulatory queries
compliance checks
documents processed
projects checked
API calls

This can eventually become a major product independent of the web application.

35. SECURITY

Implement:

secure authentication
password hashing
RBAC
project-level authorization
encrypted storage
signed upload URLs
rate limiting
audit logging
API key management
input validation
malware scanning for uploads
tenant isolation

Never expose one customer's project documents to another customer.

36. AI SAFETY / HALLUCINATION CONTROL

Implement mandatory safeguards.

If confidence is low:

REVIEW REQUIRED

If source unavailable:

SOURCE NOT VERIFIED

If sources conflict:

REGULATORY CONFLICT DETECTED

Then display both sources.

Never manufacture:

section numbers
dimensions
legal requirements
authority requirements
permit requirements
standards
37. PROFESSIONAL LIABILITY BOUNDARY

The platform must clearly communicate:

GHBC is an information and preliminary compliance intelligence system.

It does NOT:

approve buildings
issue permits
replace architects
replace engineers
replace fire authorities
replace building control officers
certify structural safety
provide legal determinations

Where professional judgment is required, explicitly say:

"Professional verification required."

38. MVP DATA SEED

Do NOT attempt to manually encode all 1,700 pages initially.

Build the ingestion pipeline first.

Seed the database with:

GS 1207:2018 metadata
38-part taxonomy
official government regulatory sources
L.I. 1630 metadata/content where legally available
official ARC guidance
official building permit information
selected local assembly requirements
official referenced standards metadata

Then progressively ingest verified requirements.

39. FIRST 10 HIGH-VALUE USE CASES

Prioritize:

Occupancy classification
Building height/area checks
Means of escape
Fire/life safety
Accessibility
Room/environment requirements
Site development
Permit documentation
Existing building compliance
Small-building requirements

These should become the strongest part of V1.

40. COMPLIANCE CHECK WORKFLOW

Implement:

USER CREATES PROJECT

↓

LOCATION

↓

OCCUPANCY

↓

BUILDING CHARACTERISTICS

↓

APPLICABLE REGULATIONS

↓

APPLICABLE REQUIREMENTS

↓

COMPLIANCE CHECK

↓

MISSING INFORMATION

↓

FINDINGS

↓

RECOMMENDATIONS

↓

SOURCE REFERENCES

↓

PDF REPORT

41. TESTING

Create automated tests for:

regulatory retrieval
source citation
rule calculations
version control
conflicting requirements
permissions
tenant isolation
document processing
hallucination resistance
API responses

Create a regulatory test suite.

Example:

Input:

residential + 3 storeys + Accra

Expected:

specific requirements activated.

Do not hard-code results unless verified against authoritative sources.

42. OBSERVABILITY

Implement:

structured logs
API monitoring
error tracking
AI request logs
retrieval metrics
source citation metrics
compliance-check audit trail

Track:

hallucination incidents
unanswered questions
low-confidence answers
conflicting sources
frequently requested regulations

These analytics should guide future product development.

43. DEPLOYMENT

Deploy to:

https://ghbc.gabochie.com

Architecture:

Internet

↓

Cloudflare/DNS

↓

ghbc.gabochie.com

↓

Application server

↓

Frontend

Backend API

Database

Vector search

Object storage

Worker queue

AI provider

Do not expose PostgreSQL publicly.

Use environment variables for:

database credentials
AI keys
storage credentials
authentication secrets
API secrets
44. DOMAIN CONFIGURATION

Prepare the application for:

ghbc.gabochie.com

Also prepare:

api.ghbc.gabochie.com

for future API access.

Potential future domains:

docs.ghbc.gabochie.com

status.ghbc.gabochie.com

45. DATABASE SCHEMA

Create tables approximately:

users

organizations

memberships

projects

project_characteristics

documents

document_pages

document_chunks

regulations

regulation_versions

requirements

requirement_conditions

rules

authorities

authority_requirements

referenced_standards

compliance_checks

compliance_findings

checklists

checklist_items

reports

ai_conversations

ai_messages

source_citations

api_keys

usage_events

audit_logs

46. API DESIGN

Use REST initially.

All API responses should support:

request_id
timestamp
status
data
warnings
sources

Example:

GET

/api/v1/requirements?occupancy=residential

POST

/api/v1/compliance/check

POST

/api/v1/projects/{project_id}/review

GET

/api/v1/projects/{project_id}/report

POST

/api/v1/ai/ask

47. DO NOT BUILD YET

Do NOT over-engineer V1 with:

full Revit plugin
full Archicad plugin
full IFC model validation
autonomous permit submission
government integrations
mobile apps
blockchain
complex microservices
custom foundation AI model

Build the regulatory intelligence core first.

48. V1 SUCCESS CRITERIA

The MVP is successful when a Ghanaian architect can:

create a project
specify location and building characteristics
ask GHBC regulatory questions
receive source-backed answers
see applicable requirements
upload project documents
receive preliminary compliance findings
see missing information
generate a compliance checklist
generate a professional PDF report

without manually searching hundreds of pages.

49. PRODUCT MOAT

Design the architecture so GHBC eventually owns a structured dataset of:

Ghanaian building requirements
regulatory relationships
project characteristics
compliance patterns
assembly requirements
professional workflows
recurring design errors
permit documentation
regulatory changes

The moat is NOT the chatbot.

The moat is the:

GHANA AEC REGULATORY KNOWLEDGE GRAPH

and its machine-readable compliance API.

50. FUTURE PRODUCT FAMILY

Architect GHBC so it can later expand into:

GHBC Architect

Design compliance assistant.

GHBC Engineer

Structural/MEP compliance assistant.

GHBC Permit

Permit-readiness platform.

GHBC Inspector

Inspection workflow.

GHBC Developer

Development feasibility and compliance intelligence.

GHBC API

Machine-readable Ghana construction regulations.

GHBC Agent API

Regulatory infrastructure for autonomous AEC agents.

51. BUILD ORDER

Implement in this exact sequence.

PHASE 1

Repository + architecture

↓

Authentication

↓

Database

↓

Design system

↓

Landing page

↓

Dashboard

PHASE 2

Regulatory source model

↓

Document ingestion

↓

Chunking

↓

Metadata

↓

Vector search

↓

Code Explorer

PHASE 3

AI Copilot

↓

RAG

↓

Citation engine

↓

Confidence scoring

↓

Source verification

PHASE 4

Project wizard

↓

Project compliance profile

↓

Requirement matching

↓

Rules engine

↓

Compliance matrix

PHASE 5

Document upload

↓

OCR/extraction

↓

Preliminary drawing/document review

↓

Findings

PHASE 6

Permit readiness

↓

Authority database

↓

Assembly-specific checklists

↓

Report generation

PHASE 7

API

↓

API keys

↓

Usage tracking

↓

Developer documentation

↓

Agent API

52. DEFINITION OF DONE

Do not stop at a prototype-looking interface.

The deployed system must have:

production authentication
responsive UI
database persistence
source-backed AI
regulatory provenance
project management
compliance workflow
document upload
report generation
audit logs
error handling
security controls
automated tests
deployment configuration
environment configuration
documentation
53. FIRST DEVELOPMENT TASK

Before writing application code:

inspect the repository
inspect available infrastructure
inspect environment variables
identify deployment environment
create architecture document
create database schema
create API specification
create regulatory source strategy
create ingestion pipeline design
create implementation roadmap

Then begin implementation.

Do NOT ask unnecessary questions.

Make sensible engineering decisions.

If a regulatory fact is uncertain, mark it as uncertain instead of inventing it.

If a source is copyrighted or access-restricted, do not copy or redistribute it unlawfully. Design the system around authorized/licensed access and legally obtained source material.

The final result must be a credible foundation for a global AEC regulatory intelligence company, not merely a chatbot wrapped around a PDF.

END MASTER PROMPT