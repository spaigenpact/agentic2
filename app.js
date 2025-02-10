/**** Configuration ****/
// Replace with your deployed serverless function URL
const API_URL = 'https://agentic2.vercel.app/api/chat';

/**** Display and Speech Synthesis ****/

function displayMessage(sender, text) {
  const chatLog = document.getElementById('chat-log');
  const messageEl = document.createElement('p');
  messageEl.innerText = `${sender}: ${text}`;
  chatLog.appendChild(messageEl);
  // auto-scroll to bottom
  chatLog.scrollTop = chatLog.scrollHeight;
}

function speakText(text) {
  if (!text || text.trim() === "") return;
  if ('speechSynthesis' in window) {
    // cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // adjust if needed
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
  
  // display user's message
  displayMessage('User', userMessage);

  // send to GPT-4
  const reply = await sendMessageToServerless(userMessage);

  // display + speak reply
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

// Press Enter in input field
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
    // show speech in input field
    document.getElementById('user-input').value = finalTranscript + interimTranscript;
  });

  // Start Voice button
  document.getElementById('start-voice').addEventListener('click', () => {
    finalTranscript = '';
    document.getElementById('user-input').value = '';
    recognition.start();
    // disable start, enable stop
    document.getElementById('start-voice').disabled = true;
    document.getElementById('stop-voice').disabled = false;
  });

  // Stop Voice button
  document.getElementById('stop-voice').addEventListener('click', () => {
    recognition.stop();
    // send final transcript automatically
    const message = document.getElementById('user-input').value.trim();
    if (message) {
      document.getElementById('user-input').value = '';
      handleUserMessage(message);
    }
    // re-enable start
    document.getElementById('start-voice').disabled = false;
    document.getElementById('stop-voice').disabled = true;
  });
}

/**** Stop Reading TTS ****/
document.getElementById('stop-reading').addEventListener('click', () => {
  console.log("Stop Reading clicked.");
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
});
