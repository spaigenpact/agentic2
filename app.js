/**** Configuration ****/
// Replace this URL with your deployed serverless function endpoint
const API_URL = 'https://YOUR-VERCEL-APP.vercel.app/api/chat';

/**** Display and Speech Synthesis ****/

// Display a message in the chat log
function displayMessage(sender, text) {
  const chatLog = document.getElementById('chat-log');
  const messageEl = document.createElement('p');
  messageEl.innerText = `${sender}: ${text}`;
  chatLog.appendChild(messageEl);
  // Auto-scroll to bottom when a new message is added
  chatLog.scrollTop = chatLog.scrollHeight;
}

// Speak text out loud (TTS)
function speakText(text) {
  if (!text || text.trim() === "") return;
  if ('speechSynthesis' in window) {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Adjust language if needed
    utterance.onstart = () => console.log("Speech started.");
    utterance.onend = () => console.log("Speech ended.");
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser.");
  }
}

/**** Serverless Request ****/

async function sendMessageToServerless(userMessage) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Server error:', errData);
      return "Error from server.";
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No reply received.";
    return reply;
  } catch (error) {
    console.error('Error communicating with serverless function:', error);
    return "Error processing your request.";
  }
}

/**** Chat Flow ****/

async function handleUserMessage(userMessage) {
  if (!userMessage.trim()) return;
  
  // Display user's message
  displayMessage('User', userMessage);

  // Send to GPT-4 (serverless) and get reply
  const reply = await sendMessageToServerless(userMessage);

  // Display GPT-4's reply
  displayMessage('Assistant', reply);

  // Speak the reply
  speakText(reply);
}

/**** UI Event Listeners ****/

// Send button (for typed input)
document.getElementById('send-btn').addEventListener('click', () => {
  const inputField = document.getElementById('user-input');
  const message = inputField.value.trim();
  inputField.value = '';
  handleUserMessage(message);
});

// Press Enter to send
document.getElementById('user-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const message = e.target.value.trim();
    e.target.value = '';
    handleUserMessage(message);
  }
});

// Stop Reading button: interrupt TTS
document.getElementById('stop-reading').addEventListener('click', () => {
  console.log("Stop Reading clicked.");
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
});
