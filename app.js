/**** Configuration ****/
// Replace with your actual deployed serverless function URL
// e.g., "https://agentic2.vercel.app/api/chat" if you named your Vercel project "agentic2"
const API_URL = 'https://agentic2.vercel.app/api/chat';

/**** Display and Speech Synthesis ****/

function displayMessage(sender, text) {
  const chatLog = document.getElementById('chat-log');
  const messageEl = document.createElement('p');
  messageEl.innerText = `${sender}: ${text}`;
  chatLog.appendChild(messageEl);
  // auto-scroll to bottom when a new message is added
  chatLog.scrollTop = chatLog.scrollHeight;
}

function speakText(text) {
  if (!text || text.trim() === "") return;
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Adjust if needed
    utterance.onstart = () => console.log("Speech started");
    utterance.onend = () => console.log("Speech ended");
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser.");
  }
}

/**** GPT-4 Serverless Interaction ****/

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
    const reply = data.choices?.[0]?.message?.content ?? "No reply received.";
    return reply;
  } catch (error) {
    console.error('Error calling serverless function:', error);
    return "Error processing your request.";
  }
}

async function handleUserMessage(userMessage) {
  if (!userMessage.trim()) return;

  // Display user message
  displayMessage('User', userMessage);

  // Send to GPT-4
  const reply = await sendMessageToServerless(userMessage);

  // Display + speak reply
  displayMessage('Assistant', await reply);
  speakText(await reply);
}

/**** Text-Based Send ****/

document.getElementById('send-btn').addEventListener('click', () => {
  const inputField = document.getElementById('user-input');
  const message = inputField.value.trim();
  inputField.value = '';
  handleUserMessage(message);
});

// Press Enter to send typed input
document.getElementById('user-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const message = e.target.value.trim();
    e.target.value = '';
    handleUserMessage(message);
  }
});

/**** Speech Recognition (Start/Stop) ****/

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!window.SpeechRecognition) {
  console.warn("Speech recognition not supported in this browser. Use text input.");
  // Optionally display a message in the chat about no voice support
} else {
  const recognition = new window.SpeechRecognition();
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let finalTranscript = '';

  recognition.addEventListener('result', (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }
    // Display recognized text in the input field
    document.getElementById('user-input').value = finalTranscript + interimTranscript;
  });

  // This event fires when recognition completely stops
  recognition.addEventListener('end', () => {
    console.log("Speech recognition ended");
    // Re-enable Start Voice button, disable Stop Voice
    document.getElementById('start-voice').disabled = false;
    document.getElementById('stop-voice').disabled = true;
  });

  // Start Voice button
  document.getElementById('start-voice').addEventListener('click', () => {
    finalTranscript = '';
    document.getElementById('user-input').value = '';
    recognition.start();
    // Disable Start, enable Stop
    document.getElementById('start-voice').disabled = true;
    document.getElementById('stop-voice').disabled = false;
  });

  // Stop Voice button
  document.getElementById('stop-voice').addEventListener('click', () => {
    recognition.stop();
    // On end, 'end' event above will also fire
    // Send final transcript automatically
    const message = document.getElementById('user-input').value.trim();
    if (message) {
      document.getElementById('user-input').value = '';
      handleUserMessage(message);
    }
  });
}

/**** Stop Reading TTS ****/
document.getElementById('stop-reading').addEventListener('click', () => {
  console.log("Stop Reading clicked.");
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
});
