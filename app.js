/**** Configuration ****/
const API_URL = 'https://agentic2.vercel.app/api/chat'; 
// Replace with your actual Vercel endpoint if different

/**** Display and Speech Synthesis ****/

function displayMessage(sender, text) {
  const chatLog = document.getElementById('chat-log');
  const messageEl = document.createElement('p');
  messageEl.innerText = `${sender}: ${text}`;
  chatLog.appendChild(messageEl);
  chatLog.scrollTop = chatLog.scrollHeight; // auto-scroll
}

// Speak text out loud (TTS)
function speakText(text) {
  if (!text || text.trim() === "") return;
  if ('speechSynthesis' in window) {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Adjust if needed
    utterance.onstart = () => console.log("Speech started.");
    utterance.onend = () => console.log("Speech ended.");
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser.");
  }
}

// Stop reading (interrupt TTS)
document.getElementById('stop-reading').addEventListener('click', () => {
  console.log("Stop Reading clicked.");
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
});

/**** Communicate with GPT-4 (Serverless) ****/

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

async function handleUserMessage(transcript) {
  if (!transcript.trim()) return;

  // Display user speech
  displayMessage('User', transcript);

  // Send to GPT-4 and get reply
  const reply = await sendMessageToServerless(transcript);

  // Display + speak reply
  displayMessage('Assistant', reply);
  speakText(reply);
}

/**** Continuous Speech Recognition Setup ****/

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!window.SpeechRecognition) {
  // iOS Safari or other unsupported browsers
  displayMessage('System', 'Speech recognition not supported in this browser. Try Chrome or Edge.');
} else {
  const recognition = new window.SpeechRecognition();
  recognition.continuous = true;     // keep listening
  recognition.interimResults = true; // show partial transcripts
  recognition.lang = 'en-US';

  let finalTranscript = '';

  recognition.addEventListener('result', (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
        // Send the final transcript to GPT-4
        handleUserMessage(finalTranscript);
        finalTranscript = '';
      } else {
        interimTranscript += transcript;
      }
    }
    // optional: you could display interim text somewhere
    console.log('Interim speech:', finalTranscript + interimTranscript);
  });

  recognition.addEventListener('end', () => {
    // auto-restart to maintain continuous listening
    recognition.start();
  });

  // Start recognition immediately on page load
  recognition.start();
  displayMessage('System', 'Listening... (speak now)');
}
