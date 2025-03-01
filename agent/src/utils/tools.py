import json
from datetime import datetime

from core.rag import model, retriever  # Import RAG components
from langchain_core.tools import tool


@tool
def compliance_checker(requirements: str) -> str:
    """
    Analyzes specific PCI DSS requirements and provides compliance guidance.

    Args:
        requirements: Description of requirements to check
    Returns:
        Detailed compliance analysis and recommendations
    """
    try:
        # Get relevant PCI DSS context through RAG
        docs = retriever.invoke(
            f"PCI DSS requirements and controls related to: {requirements}"
        )

        # Combine document contents for context
        pci_dss_context = (
            "\n\n".join([doc.page_content for doc in docs]) if docs else ""
        )

        # Create analysis prompt with fallback to general knowledge
        analysis_prompt = f"""You are Dexter.ai, a compliance specialist. Analyze the following PCI DSS requirements and provide a detailed compliance review. 

Requirements to Check: {requirements}

{f"PCI DSS Context: {pci_dss_context}" if pci_dss_context else "Note: Using general security and compliance knowledge."}

Structure your response into the following sections:
1. **Requirements Mapped**:
   - {'''Clearly map each of the requirements to the relevant PCI DSS sections, indicating the section numbers and relevant clauses.''' if pci_dss_context else '''Map requirements to relevant security frameworks and standards (ISO 27001, NIST, etc.).'''}
2. **Compliance Status**:
   - Indicate whether the requirement is compliant, partially compliant, or non-compliant.
   - For non-compliant sections, explain why.
3. **Gap Analysis**:
   - Identify any gaps between the requirements and the current state of compliance.
4. **Implementation Recommendations**:
   - Suggest actions, including controls, strategies, and technical specifications to close the gaps.
5. **Detailed JSON Output**:
   - Provide a detailed JSON response including the compliance status, gap analysis, and implementation guidance.

{'''Use specific PCI DSS references and requirements.''' if pci_dss_context else '''Draw from general security frameworks and best practices.'''}"""

        # Generate analysis using LLM
        response = model.generate_content(analysis_prompt)
        return (
            response.text.strip()
            if response.text.strip()
            else json.dumps(
                {
                    "error": "Could not generate analysis. Please provide more specific requirements.",
                    "timestamp": datetime.now().isoformat(),
                }
            )
        )

    except Exception as e:
        return json.dumps(
            {
                "error": f"Error in compliance analysis: {str(e)}",
                "timestamp": datetime.now().isoformat(),
            }
        )


@tool
def policy_generator(policy_type: str) -> str:
    """
    Generates policy templates based on PCI DSS requirements or general security best practices.

    Args:
        policy_type: Type of policy to generate
    Returns:
        Policy template with key components
    """
    try:
        # Get relevant PCI DSS context through RAG
        docs = retriever.invoke(
            f"PCI DSS requirements and controls for {policy_type} policy"
        )

        # Combine document contents for context
        pci_dss_context = (
            "\n\n".join([doc.page_content for doc in docs]) if docs else ""
        )

        # Create policy generation prompt
        policy_prompt = f"""You are Dexter.ai, creating a detailed policy for {'''PCI DSS compliance''' if pci_dss_context else "security compliance"}. 

Policy Type: {policy_type}
{f"PCI DSS Context: {pci_dss_context}" if pci_dss_context else "Note: Using general security and compliance knowledge."}

**Policy Breakdown**:
1. **Policy Overview**: 
   - Provide an introduction to the policy's purpose and why it's critical for {'''PCI DSS compliance''' if pci_dss_context else "security compliance"}.

2. **Scope and Applicability**: 
   - Define who and what is affected by the policy.

3. **Specific Requirements**: 
   - {'''List the specific PCI DSS sections covered by this policy.''' if pci_dss_context else '''List the specific security requirements and standards covered by this policy.'''}

4. **Governance**: 
   - Define the roles, responsibilities, and decision-making processes for the policy.

5. **Controls**: 
   - Provide actionable controls required for compliance.

6. **Audit Procedures**: 
   - Outline audit methods and procedures to verify policy adherence.

Format the response as a detailed JSON policy document."""

        # Generate policy using LLM
        response = model.generate_content(policy_prompt)
        return (
            response.text.strip()
            if response.text.strip()
            else json.dumps(
                {
                    "error": "Could not generate policy. Please specify a valid policy type.",
                    "timestamp": datetime.now().isoformat(),
                }
            )
        )

    except Exception as e:
        return json.dumps(
            {
                "error": f"Error in policy generation: {str(e)}",
                "timestamp": datetime.now().isoformat(),
            }
        )


@tool
def risk_assessor(scenario: str) -> str:
    """
    Performs intelligent risk assessment using PCI DSS context or general security principles.

    Args:
        scenario: Detailed description of the security scenario to assess
    Returns:
        Comprehensive risk assessment
    """
    try:
        # Get relevant PCI DSS context through RAG
        docs = retriever.invoke(
            f"PCI DSS requirements and controls related to: {scenario}"
        )

        # Combine document contents for context
        pci_dss_context = (
            "\n\n".join([doc.page_content for doc in docs]) if docs else ""
        )

        # Create comprehensive analysis prompt
        analysis_prompt = f"""You are Dexter.ai, performing a comprehensive risk assessment for a security scenario. 

Scenario: {scenario}
{f"PCI DSS Context: {pci_dss_context}" if pci_dss_context else "Note: Using general security and risk assessment knowledge."}

**Assessment Structure**:
1. **Executive Summary**: 
   - Summarize the key risks and outcomes of the assessment.

2. **Risk Identification**: 
   - List and assess potential risks in the given scenario.

3. **{'''PCI DSS Requirements Analysis''' if pci_dss_context else "Security Requirements Analysis"}**: 
   - {'''Detail the PCI DSS requirements that apply to the scenario.''' if pci_dss_context else "Detail the security requirements and standards that apply to the scenario."}

4. **Required Controls**: 
   - Define the necessary technical and operational controls to mitigate risks.

5. **Mitigation Strategies**: 
   - Provide a clear strategy for mitigating identified risks.

6. **Implementation Recommendations**: 
   - Suggest practical, actionable steps to reduce risks and improve compliance.

Format the response as a detailed JSON assessment document."""

        # Generate risk assessment using LLM
        response = model.generate_content(analysis_prompt)

        if response.text.strip():
            assessment = {
                "timestamp": datetime.now().isoformat(),
                "scenario": scenario,
                "risk_assessment": response.text.strip(),
                "metadata": {
                    "assessment_type": "comprehensive",
                    "confidence_level": "high",
                    "framework": "PCI DSS 4.0"
                    if pci_dss_context
                    else "General Security Best Practices",
                },
            }
            return json.dumps(assessment, indent=2)

        return json.dumps(
            {
                "error": "Could not generate risk assessment. Please try again with more specific scenario details.",
                "timestamp": datetime.now().isoformat(),
            }
        )

    except Exception as e:
        return json.dumps(
            {
                "error": f"Error during risk assessment: {str(e)}",
                "timestamp": datetime.now().isoformat(),
            }
        )


@tool
def implementation_planner(requirement: str) -> str:
    """
    Creates implementation plans based on PCI DSS requirements or security best practices.

    Args:
        requirement: The requirement to plan for
    Returns:
        Structured implementation plan
    """
    try:
        # Get relevant PCI DSS context through RAG
        docs = retriever.invoke(
            f"""PCI DSS implementation details for: {requirement}
            Include:
            - Requirement specifications
            - Testing procedures
            - Implementation guidance
            - Technical requirements"""
        )

        # Combine document contents for context
        pci_dss_context = (
            "\n\n".join([doc.page_content for doc in docs]) if docs else ""
        )

        # Create implementation planning prompt
        planning_prompt = f"""You are Dexter.ai, generating an implementation plan for {'''PCI DSS compliance''' if pci_dss_context else "security compliance"}. 

Requirement: {requirement}
{f"PCI DSS Context: {pci_dss_context}" if pci_dss_context else "Note: Using general security implementation knowledge."}

**Plan Structure**:
1. **Overview**: 
   - Provide a high-level overview of the requirement and its importance.

2. **Implementation Phases**: 
   Break down the plan into actionable phases:
   - **Phase 1: Assessment**
     * Define the assessment requirements and necessary tools.
   - **Phase 2: Planning**
     * Outline how to plan for the implementation, including necessary resources and timelines.
   - **Phase 3: Execution**
     * Provide detailed technical steps for the execution of the plan.
   - **Phase 4: Testing**
     * Include specific testing procedures to validate compliance.
   - **Phase 5: Maintenance**
     * Define ongoing maintenance activities for long-term compliance.

3. **Timeline and Resources**: 
   - List the expected timeline for each phase and the required resources.

4. **Validation**: 
   - Explain how to validate successful implementation and compliance.

Format the response as a detailed JSON implementation plan."""

        # Generate plan using LLM
        response = model.generate_content(planning_prompt)
        return (
            response.text.strip()
            if response.text.strip()
            else json.dumps(
                {
                    "error": "Could not generate implementation plan. Please provide more specific requirements.",
                    "timestamp": datetime.now().isoformat(),
                }
            )
        )

    except Exception as e:
        return json.dumps(
            {
                "error": f"Error in implementation planning: {str(e)}",
                "timestamp": datetime.now().isoformat(),
            }
        )
