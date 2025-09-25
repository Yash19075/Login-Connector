from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, AIMessage
from dotenv import load_dotenv
from langgraph.checkpoint.memory import InMemorySaver
from typing import TypedDict, Annotated
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

load_dotenv()

model = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    query: str
    docs: list[str]
    response: str

checkpointer = InMemorySaver()
parser = StrOutputParser()

loader = TextLoader("someText.txt", encoding="utf-8")
docs = loader.load()

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
splits = text_splitter.split_documents(docs)

vectorstore = Chroma.from_documents(splits, embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant. Use the provided context to answer questions accurately."),
    ("human", "Context:\n{context}\n\nQuestion:\n{question}"),
    MessagesPlaceholder("chat_history")
])

chain = prompt | model | parser

def retrieve_node(state: ChatState):
    docs = retriever.get_relevant_documents(state["query"])
    state["docs"] = [d.page_content for d in docs]
    return state

def generate_node(state: ChatState):
    context = "\n\n".join(state["docs"])
    response = chain.invoke({
        "context": context,
        "question": state["query"],
        "chat_history": state["messages"]
    })
    state["response"] = response
    state["messages"].append(AIMessage(content=response))
    return state

graph = StateGraph(ChatState)
graph.add_node("retriever", retrieve_node)
graph.add_node("generator", generate_node)
graph.set_entry_point("retriever")
graph.add_edge("retriever", "generator")
graph.add_edge("generator", END)

app = graph.compile(checkpointer=checkpointer)
thread_config = {"configurable": {"thread_id": "chat-1"}}

messages: list[BaseMessage] = []

while True:
    user_input = input("You: ")
    if user_input.lower() in {"exit", "quit"}:
        print("Exiting chat.")
        break

    state = {"query": user_input, "messages": messages, "docs": [], "response": ""}
    result = app.invoke(state, config=thread_config)
    messages = result["messages"]

    print("Bot:", result["response"])
