const axiosClient = (typeof window !== 'undefined' && window.axios) ? window.axios : null;

const messages = document.getElementById('messages');
const info = document.getElementById('info');
const input = document.getElementById('input');
const systemMessage = {
  search: "🔍 Searching for relevant sources...",
  analyze: "📚 Analyzing sources...",
  final: "✍️ Writing final answer..."
};

input.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && input.value.trim()) {
    const message = input.value;
    info.setAttribute('style', 'display: none;')
    input.value = '';
    addMessage(message, 'user');

    await handleResponse(message);
  };
});

async function handleResponse(message) {
  updateThinkingMessage(systemMessage.search);
  
  let search = await call('search', 3000, message);
  updateThinkingMessage(systemMessage.analyze);
  
  let analyze = await call('analyze', 3000, [message, search])
  updateThinkingMessage(systemMessage.final);
  
  let final = await call('final', 3000, [message, analyze])
  currentThinkingMsg.remove();
  currentThinkingMsg = null;

  addMessage(final, 'bot');
};

const call = async (url, port, userInput) => {
  if (!axiosClient) {
    const msg = 'axios is not available in the browser. Add a script tag for axios (https://unpkg.com/axios/dist/axios.min.js) in index.html';
    console.error(msg);
    return `❌ Error: ${msg}`;
  }

  try {
    const payload = typeof userInput === 'string' ? { message: userInput } : userInput;

    const config = {
      method: 'post',
      url: `http://localhost:${port}/${url}`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: payload,
      timeout: 60000
    };

    const response = await axiosClient(config);

    return response.data;
  } catch (err) {
    console.error('call() error', err);

    return `❌ Error: ${err?.response?.data ?? err.message ?? String(err)}`;
  }
};

let currentThinkingMsg = null;

function addMessage(text, type) {
  const msg = document.createElement('div');
  msg.className = `msg ${type}`;

  if (type === 'thinking') {
    msg.innerHTML = `<span class="status-dot"></span>${text}`;
  } else {
    msg.innerHTML = text.indexOf('```html') !== -1 ? text.substring(7, text.length - 4) : text;
  };

  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
  return msg;
};

function updateThinkingMessage(text) {
  if (!currentThinkingMsg) {
    currentThinkingMsg = addMessage(text, 'thinking');
  } else {
    currentThinkingMsg.innerHTML = `<span class="status-dot"></span>${text}`;
  };
};