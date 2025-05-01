// ===== DataContext.tsx =====
// ... inside createChat function ...
    const newChat: Chat = {
      id: `chat-${uuidv4()}`,
      title: `Nova conversa - ${new Date().toLocaleString('pt-BR')}`,
      messages: [],
      expertId: copyRequest.expertId,
      agentId: copyRequest.agentId,
      contentType: copyRequest.contentType, // <-- Save contentType here
      userId: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
// ... rest of DataContext ...


// ===== Home.tsx =====
// ... inside useEffect hook reacting to [currentChat] ...
  useEffect(() => {
    // Sync selectors if currentChat changes (e.g., from history sidebar)
    setSelectedExpert(currentChat?.expertId);
    setSelectedAgent(currentChat?.agentId);
    setSelectedContentType(currentChat?.contentType); // <-- Load contentType from chat
    setPromptInput(""); // Clear input when chat changes
    setIsGenerating(false); // Ensure generation stops if chat changes
  }, [currentChat]);
// ... rest of Home.tsx ... 