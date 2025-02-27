from typing import Dict, List, Optional, TypedDict

from core.rag import model, rag_retrieval
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph


# Define the state
class ConversationState(TypedDict):
    """State for the conversation flow"""

    messages: List[HumanMessage | AIMessage | SystemMessage]
    needs_pci_context: bool
    pci_context: Optional[str]


def understand_query(state: Dict) -> Dict:
    """LLM determines if query needs security standards context"""
    try:
        query = state["messages"][-1]
        previous_messages = state["messages"][:-1]

        conversation_context = "\n".join(
            [
                f"{'User' if isinstance(msg, HumanMessage) else 'Assistant'}: {msg}"
                for msg in previous_messages[-3:]
                if isinstance(msg, (HumanMessage, AIMessage))
            ]
        )

        prompt = f"""You are Dexter.ai, a friendly and knowledgeable security and compliance consultant. Your task is to determine if the query needs specific security standard information to provide an accurate response.

CONVERSATION HISTORY:
{conversation_context}

CURRENT QUERY: "{query}"

ANALYSIS FRAMEWORK:
1. Security Standard References
   - Mentions of specific standards (PCI DSS, ISO, NIST, etc.)
   - Questions about compliance requirements
   - Implementation or audit queries

2. Security Context Indicators
   - Questions about security controls
   - Infrastructure or architecture queries
   - Risk management considerations

3. Follow-up Analysis
   - Requests for more details
   - Questions building on previous topics
   - Indications of incomplete information

4. Technical Requirements
   - Implementation questions
   - Configuration queries
   - Best practices inquiries

DECISION CRITERIA:
- Output 'true' if:
  * Query relates to security standards
  * Technical implementation details needed
  * Compliance guidance required
  * Security best practices requested
- Output 'false' for:
  * General greetings
  * Personal questions
  * Non-security topics

OUTPUT: Respond with only 'true' or 'false'"""

        response = model.generate_content(prompt)
        needs_context = response.text.strip().lower() == "true"

        state["needs_pci_context"] = needs_context
        return state

    except Exception as e:
        state["needs_pci_context"] = f"Error: {e}"
        return state


def get_pci_context(state: Dict) -> Dict:
    """RAG tool to retrieve relevant security standards context"""
    try:
        if state["needs_pci_context"]:
            current_query = state["messages"][-1]
            previous_messages = state["messages"][:-1]

            recent_conversation = "\n".join(
                [
                    f"{'User' if isinstance(msg, HumanMessage) else 'Assistant'}: {msg}"
                    for msg in previous_messages[-3:]
                    if isinstance(msg, (HumanMessage, AIMessage))
                ]
            )

            enhanced_query = f"""CONTEXT RETRIEVAL QUERY

CONVERSATION HISTORY:
{recent_conversation}

CURRENT QUERY: "{current_query}"

SEARCH OBJECTIVES:
1. Exact Requirements
   - Find exact requirement numbers and text
   - Locate specific testing procedures
   - Identify precise guidance sections

2. Supporting Information
   - Related requirements
   - Implementation guidance
   - Testing procedures
   - Applicability notes

3. Version Information
   - Standard version
   - Requirement updates
   - Implementation dates

4. Technical Details
   - Specific parameters
   - Configuration details
   - Technical specifications

FOCUS: Find exact matches from the standards, including requirement text, testing procedures, and guidance."""

            context = rag_retrieval(enhanced_query)
            state["pci_context"] = context
        return state
    except Exception as e:
        state["pci_context"] = f"Error: {e}"
        return state


def generate_response(state: Dict) -> Dict:
    """LLM generates response using its knowledge and context if available"""
    try:
        query = state["messages"][-1]

        if state["needs_pci_context"] and state["pci_context"]:
            prompt = f"""You are Dexter.ai, a helpful and friendly consultant. You provide accurate information from security standards while maintaining a natural conversation style.

QUERY: "{query}"

RETRIEVED INFORMATION:
{state["pci_context"]}

Response Guidelines:
1. Source Transparency
   - Always mention when you're quoting directly from standards
   - Specify which version/section you're referencing
   - Acknowledge if information is from supplementary guidance

2. Information Accuracy
   - Quote exact requirement numbers and text
   - Don't fill in gaps with assumptions
   - If information is incomplete, say so
   - Offer to look up additional details if needed

3. Clarity
   - Explain technical terms
   - Use examples when helpful
   - Break down complex requirements
   - Keep the tone conversational

4. Knowledge Boundaries
   - If you're not sure, say so
   - Don't make up information
   - Offer to find more specific details
   - Be clear about what's official vs. guidance

Keep your tone:
- Natural and friendly
- Clear about sources
- Honest about limitations
- Helpful without overstepping"""
        else:
            prompt = f"""You are Dexter.ai, a helpful and friendly consultant. You're knowledgeable about security and compliance but maintain a natural conversation style.

QUERY: "{query}"

Guidelines:
1. Natural Conversation
   - Keep responses casual and friendly
   - Don't introduce yourself repeatedly
   - Respond naturally to greetings
   - Stay conversational

2. Knowledge Boundaries
   - Be clear about what you know
   - Don't make assumptions
   - Offer to look up specific details
   - Be honest about limitations

3. Helpful Guidance
   - Suggest relevant topics
   - Offer to explore specific areas
   - Guide without being pushy
   - Keep it simple and clear

Remember:
- Stay natural and friendly
- Be honest about what you know
- Don't repeat generic phrases
- Keep the conversation flowing naturally"""

        response = model.generate_content(prompt)
        state["messages"].append(AIMessage(content=response.text.strip()))
        return state

    except Exception as e:
        state["messages"].append(
            AIMessage(
                content=f"I encountered an error. Could you rephrase your question? Error: {e}"
            )
        )
        print(f"Error: {e}")
        return state


# Initialize the graph
workflow = StateGraph(ConversationState)

# Add nodes
workflow.add_node("understand", understand_query)
workflow.add_node("get_context", get_pci_context)
workflow.add_node("generate_response", generate_response)

# Define conditional edges
workflow.add_edge(START, "understand")
workflow.add_conditional_edges(
    "understand",
    lambda state: "get_context" if state["needs_pci_context"] else "generate_response",
)
workflow.add_edge("get_context", "generate_response")
workflow.add_edge("generate_response", END)

# Compile the graph
app = workflow.compile()


def main():
    """Interactive conversation loop"""
    print("\n=== Dexter.ai ===")
    print(
        "Hi! I'm Dexter, and I'm here to help with any security or compliance questions you might have."
    )
    print("What's on your mind?\n")

    while True:
        try:
            query = input("You: ").strip()

            if not query:
                continue

            if query.lower() in ["exit", "quit", "bye"]:
                print("\nThanks for chatting! Have a great day!\n")
                break

            # Initialize state for this query
            state = {
                "messages": [
                    SystemMessage(
                        content="""You are Dexter.ai, a helpful and friendly consultant. While you have expertise in security and compliance, you speak like a helpful friend having a natural conversation. Keep responses natural and conversational, avoid being overly formal or repeatedly mentioning your expertise."""
                    ),
                    HumanMessage(content=query),
                ],
                "needs_pci_context": False,
                "pci_context": None,
            }

            # Process through the graph
            result = app.invoke(state)

            # Print the response
            print(f"\nDexter.ai: {result['messages'][-1].content}\n")

        except KeyboardInterrupt:
            print("\nBye! Take care!\n")
            break
        except Exception:
            print("\nOops, something went wrong. Mind trying that again?")


if __name__ == "__main__":
    main()
