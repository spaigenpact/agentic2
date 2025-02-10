/**** Configuration ****/
// Replace with your actual serverless function URL, e.g.
// const API_URL = "https://agentic2.vercel.app/api/chat";
const API_URL = "https://agentic2.vercel.app/api/chat";

/**** Display and Speech Synthesis ****/

function displayMessage(sender, text) {
  const chatLog = document.getElementById('chat-log');
  const messageEl = document.createElement('p');
  messageEl.innerText = `${sender}: ${text}`;
  chatLog.appendChild(messageEl);
  // auto-scroll
  chatLog.scrollTop = chatLog.scrollHeight;
}

function speakText(text) {
  if (!text || text.trim() === "") return;
  if ('speechSynthesis' in window) {
    // cancel any ongoing TTS
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // adjust if needed
    utterance.onstart = () => console.log("Speech started.");
    utterance.onend = () => console.log("Speech ended.");
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

  displayMessage('User', userMessage);

  const reply = await sendMessageToServerless(userMessage);

  displayMessage('Assistant', reply);
  speakText(reply);
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
  console.warn("Speech recognition not supported. Use text input only.");
  // Optionally display a message in the chat or disable the voice buttons
} else {
  const recognition = new window.SpeechRecognition();
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let finalTranscript = '';

  // On partial/final results
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

  // When speech recognition completely ends (stop, user silence, etc.)
  recognition.addEventListener('end', () => {
    console.log("Speech recognition ended");
    // Re-enable "Start Voice", disable "Stop Voice"
    document.getElementById('start-voice').disabled = false;
    document.getElementById('stop-voice').disabled = true;
  });

  // Start Voice
  document.getElementById('start-voice').addEventListener('click', () => {
    console.log("Start Voice clicked");
    finalTranscript = '';
    document.getElementById('user-input').value = '';
    recognition.start();
    // disable "Start Voice", enable "Stop Voice"
    document.getElementById('start-voice').disabled = true;
    document.getElementById('stop-voice').disabled = false;
  });

  // Stop Voice
  document.getElementById('stop-voice').addEventListener('click', () => {
    console.log("Stop Voice clicked");
    recognition.stop();
    // Once ended, 'end' event re-enables Start Voice
  });
}

/**** Stop Reading (Interrupt TTS) ****/
document.getElementById('stop-reading').addEventListener('click', () => {
  console.log("Stop Reading clicked");
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
});
