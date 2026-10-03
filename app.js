/* =========================================================
   GULAB AI V2
   Supabase Connected Frontend Controller
   ========================================================= */


/* =========================================================
   SUPABASE CONNECTION
========================================================= */

let supabaseClient = null;

try {
  if (
    window.supabase &&
    window.GULAB_SUPABASE_URL &&
    window.GULAB_SUPABASE_KEY
  ) {
    supabaseClient = window.supabase.createClient(
      window.GULAB_SUPABASE_URL,
      window.GULAB_SUPABASE_KEY
    );

    console.log("🌹 GULAB AI → Supabase client initialized");
  } else {
    console.warn("GULAB AI → Supabase configuration missing");
  }
} catch (error) {
  console.error("Supabase initialization failed:", error);
}


/* =========================================================
   HELPERS
========================================================= */

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  document.querySelectorAll(selector);


/* =========================================================
   STORAGE
========================================================= */

const STORAGE = {
  memory: "gulab_memory_v2",
  history: "gulab_history_v2",
  settings: "gulab_settings_v2"
};


/* =========================================================
   SAFE LOCAL STORAGE
========================================================= */

function readStorage(key, fallback) {

  try {

    const value =
      localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : fallback;

  } catch {

    return fallback;

  }
}


function writeStorage(key, value) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    return true;

  } catch {

    return false;

  }
}


/* =========================================================
   APPLICATION STATE
========================================================= */

let state = {

  memory:
    readStorage(
      STORAGE.memory,
      []
    ),

  history:
    readStorage(
      STORAGE.history,
      []
    ),

  settings:
    readStorage(
      STORAGE.settings,
      {
        assistantName: "GULAB",
        language: "hi"
      }
    )

};


/* =========================================================
   ELEMENTS
========================================================= */

const screens =
  $$(".screen");

const navItems =
  $$(".nav-item");

const aiCore =
  $("#aiCore");

const aiState =
  $("#aiState");

const aiTranscript =
  $("#aiTranscript");

const messages =
  $("#messages");

const chatForm =
  $("#chatForm");

const chatInput =
  $("#chatInput");

const memoryList =
  $("#memoryList");

const memoryCount =
  $("#memoryCount");

const toastElement =
  $("#toast");

const assistantNameInput =
  $("#assistantName");

const languageInput =
  $("#language");

const aiEngine =
  $("#aiEngine");

const connectionStatus =
  $("#connectionStatus");

const memoryStatus =
  $("#memoryStatus");


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function toast(message) {

  if (!toastElement) return;

  toastElement.textContent =
    message;

  toastElement.classList.add(
    "show"
  );

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(() => {

      toastElement.classList.remove(
        "show"
      );

    }, 2200);
}


/* =========================================================
   NAVIGATION
========================================================= */

function openPage(pageName) {

  screens.forEach((screen) => {

    screen.classList.toggle(
      "active",
      screen.id === pageName
    );

  });

  navItems.forEach((button) => {

    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );

  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


navItems.forEach((button) => {

  button.addEventListener(
    "click",
    () => {

      const page =
        button.dataset.page;

      if (page) {
        openPage(page);
      }

    }
  );

});


/* =========================================================
   LOCAL STATE SAVE
========================================================= */

function saveState() {

  writeStorage(
    STORAGE.memory,
    state.memory
  );

  writeStorage(
    STORAGE.history,
    state.history
  );

  writeStorage(
    STORAGE.settings,
    state.settings
  );
}


/* =========================================================
   MEMORY UI
========================================================= */

function updateMemoryUI() {

  if (memoryCount) {

    memoryCount.textContent =
      state.memory.length;

  }

  if (memoryStatus) {

    memoryStatus.textContent =
      state.memory.length > 0
        ? `${state.memory.length} SAVED`
        : "READY";

  }

  renderMemory();
}


function renderMemory() {

  if (!memoryList) return;

  if (state.memory.length === 0) {

    memoryList.innerHTML = `
      <div class="memory-card">
        <b>No memories yet</b>

        <p>
          Teach GULAB something important
          and it will be saved on this device.
        </p>
      </div>
    `;

    return;
  }


  memoryList.innerHTML =
    state.memory
      .slice()
      .reverse()
      .map((item) => {

        const title =
          escapeHTML(
            item.title || "Memory"
          );

        const text =
          escapeHTML(
            item.text || ""
          );

        const id =
          escapeHTML(
            String(item.id)
          );

        return `
          <div class="memory-card">

            <b>${title}</b>

            <p>${text}</p>

            <button
              type="button"
              data-delete-memory="${id}"
            >
              DELETE
            </button>

          </div>
        `;

      })
      .join("");


  $$("[data-delete-memory]")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.deleteMemory;

          state.memory =
            state.memory.filter(
              item =>
                String(item.id) !==
                String(id)
            );

          saveState();

          updateMemoryUI();

          toast(
            "Memory deleted."
          );

        }
      );

    });

}


/* =========================================================
   ADD MEMORY
========================================================= */

function addMemory(title, text) {

  if (!text || !text.trim()) {
    return;
  }

  const cleanTitle =
    title?.trim() ||
    "Personal Memory";

  const cleanText =
    text.trim();

  const existing =
    state.memory.find(
      item =>
        item.title.toLowerCase() ===
        cleanTitle.toLowerCase()
    );


  if (existing) {

    existing.text =
      cleanText;

    existing.updatedAt =
      new Date().toISOString();

  } else {

    state.memory.push({

      id: Date.now(),

      title:
        cleanTitle,

      text:
        cleanText,

      createdAt:
        new Date().toISOString()

    });

  }

  saveState();

  updateMemoryUI();
}


/* =========================================================
   MEMORY COMMAND
========================================================= */

function detectMemoryCommand(text) {

  const q =
    text.trim();

  const lower =
    q.toLowerCase();


  const remember =
    lower.includes("remember") ||
    lower.includes("yaad rakho") ||
    lower.includes("yaad rakhna") ||
    lower.includes("याद रखो") ||
    lower.includes("याद रखना");


  if (!remember) {
    return null;
  }


  let content =
    q
      .replace(/remember that/gi, "")
      .replace(/remember/gi, "")
      .replace(/yaad rakho/gi, "")
      .replace(/yaad rakhna/gi, "")
      .replace(/याद रखो/g, "")
      .replace(/याद रखना/g, "")
      .trim();


  if (!content) {
    return null;
  }


  if (
    /^mera naam/i.test(content) ||
    /^मेरा नाम/.test(content)
  ) {

    const name =
      content
        .replace(/^mera naam/i, "")
        .replace(/^मेरा नाम/, "")
        .replace(/^hai/i, "")
        .replace(/^है/, "")
        .trim();


    if (name) {

      return {

        title: "Name",

        text:
          `User's name is ${name}`

      };

    }

  }


  return {

    title:
      "Personal Memory",

    text:
      content

  };

}


/* =========================================================
   MEMORY QUESTION
========================================================= */

function answerMemoryQuestion(text) {

  const q =
    text.toLowerCase();


  const askingName =
    q.includes("mera naam kya hai") ||
    q.includes("मेरा नाम क्या है") ||
    q.includes("what is my name");


  if (askingName) {

    const nameMemory =
      state.memory.find(
        item =>
          item.title.toLowerCase() ===
          "name"
      );


    if (nameMemory) {

      const name =
        nameMemory.text
          .replace(
            /^user's name is/i,
            ""
          )
          .trim();

      return (
        `आपका नाम ${name} है। मुझे याद है।`
      );

    }

    return (
      "अभी मुझे आपका नाम याद नहीं है।"
    );

  }


  return null;
}


/* =========================================================
   CHAT UI
========================================================= */

function addMessage(role, text) {

  if (!messages) return;

  const div =
    document.createElement("div");

  div.className =
    `msg ${role}`;


  const label =
    role === "user"
      ? "YOU"
      : "GULAB";


  div.innerHTML = `
    <small>${label}</small>

    <div>
      ${escapeHTML(text)}
    </div>
  `;


  messages.appendChild(div);

  messages.scrollTop =
    messages.scrollHeight;
}


function clearMessages() {

  if (messages) {

    messages.innerHTML =
      "";

  }

}


/* =========================================================
   HISTORY
========================================================= */

function saveHistory(
  userText,
  aiText
) {

  state.history.push({

    id:
      Date.now(),

    user:
      userText,

    assistant:
      aiText,

    time:
      new Date().toISOString()

  });


  if (
    state.history.length > 100
  ) {

    state.history =
      state.history.slice(-100);

  }


  saveState();

  renderHistory();
}


function renderHistory() {

  const container =
    $("#historyList");

  if (!container) return;


  if (
    state.history.length === 0
  ) {

    container.innerHTML = `
      <div class="history-card">

        <b>No activity yet</b>

        <p>
          Your future GULAB conversations
          will appear here.
        </p>

      </div>
    `;

    return;
  }


  container.innerHTML =
    state.history
      .slice()
      .reverse()
      .slice(0, 30)
      .map(item => {

        return `
          <div class="history-card">

            <b>
              ${escapeHTML(
                item.user
              )}
            </b>

            <p>
              ${escapeHTML(
                item.assistant
              )}
            </p>

            <small>
              ${new Date(
                item.time
              ).toLocaleString()}
            </small>

          </div>
        `;

      })
      .join("");
}


/* =========================================================
   LOCAL ASSISTANT
========================================================= */

function localAssistant(text) {

  const q =
    text.toLowerCase();


  const memoryAnswer =
    answerMemoryQuestion(text);

  if (memoryAnswer) {
    return memoryAnswer;
  }


  const memoryCommand =
    detectMemoryCommand(text);


  if (memoryCommand) {

    addMemory(
      memoryCommand.title,
      memoryCommand.text
    );

    return (
      "ठीक है। मैंने इसे GULAB की memory में save कर लिया है।"
    );

  }


  if (
    q.includes("hello") ||
    q.includes("hi") ||
    q.includes("नमस्ते") ||
    q.includes("हेलो")
  ) {

    return `
नमस्ते! 🌹 मैं GULAB हूँ।

मैं तुम्हारे साथ chat, voice,
memory और future intelligent
tasks के लिए तैयार हूँ।
`;

  }


  if (
    q.includes("what can you do") ||
    q.includes("क्या कर सकते")
  ) {

    return `
मैं GULAB AI हूँ।

मैं chat, voice interface,
memory, personal settings
और future intelligent tasks
के लिए तैयार किया गया हूँ।

Secure cloud AI backend
अगले चरण में connect होगा।
`;

  }


  if (
    q.includes("time") ||
    q.includes("समय")
  ) {

    return `
अभी समय है:

${new Date().toLocaleTimeString()}
`;

  }


  return `
मैंने तुम्हारी बात समझी।

GULAB V2 का secure AI backend
अभी development में है।

फिलहाल मैं local assistant
mode में काम कर रहा हूँ।
`;

}


/* =========================================================
   AI RESPONSE
========================================================= */

async function askGulab(text) {

  setAIState(
    "THINKING",
    "Processing your request..."
  );


  /*
    Gemini backend will be connected
    through Supabase Edge Function
    in the next stage.
  */

  await wait(350);


  const response =
    localAssistant(text);


  setAIState(
    "READY",
    "Response ready"
  );


  return response;
}


/* =========================================================
   CHAT FORM
========================================================= */

if (chatForm) {

  chatForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const text =
        chatInput.value.trim();


      if (!text) return;


      chatInput.value =
        "";


      addMessage(
        "user",
        text
      );


      const response =
        await askGulab(text);


      addMessage(
        "ai",
        response
      );


      saveHistory(
        text,
        response
      );

    }
  );

}


/* =========================================================
   QUICK COMMANDS
========================================================= */

$$("[data-command]")
  .forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        const command =
          button.dataset.command;


        openPage("chat");


        addMessage(
          "user",
          command
        );


        const response =
          await askGulab(command);


        addMessage(
          "ai",
          response
        );


        saveHistory(
          command,
          response
        );

      }
    );

  });


/* =========================================================
   VOICE RECOGNITION
========================================================= */

let recognition = null;

let isListening =
  false;


const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


if (SpeechRecognition) {

  recognition =
    new SpeechRecognition();


  recognition.continuous =
    false;

  recognition.interimResults =
    false;

  recognition.lang =
    "hi-IN";


  recognition.onstart =
    () => {

      isListening =
        true;


      aiCore?.classList.add(
        "listening"
      );


      setAIState(
        "LISTENING",
        "I'm listening..."
      );

    };


  recognition.onresult =
    async (event) => {

      const text =
        event.results[0][0]
          .transcript;


      if (aiTranscript) {

        aiTranscript.textContent =
          text;

      }


      openPage("chat");


      addMessage(
        "user",
        text
      );


      const response =
        await askGulab(text);


      addMessage(
        "ai",
        response
      );


      saveHistory(
        text,
        response
      );


      speak(response);

    };


  recognition.onerror =
    () => {

      setAIState(
        "READY",
        "Voice input unavailable"
      );

    };


  recognition.onend =
    () => {

      isListening =
        false;


      aiCore?.classList.remove(
        "listening"
      );

    };

} else {

  console.log(
    "Speech Recognition is not supported."
  );

}


/* =========================================================
   VOICE BUTTON
========================================================= */

const voiceButton =
  $("#voiceButton");


function startVoice() {

  if (!recognition) {

    toast(
      "Voice recognition is not supported by this browser."
    );

    return;
  }


  if (isListening) {

    recognition.stop();

    return;

  }


  try {

    recognition.start();

  } catch {

    toast(
      "Voice is already active."
    );

  }

}


voiceButton?.addEventListener(
  "click",
  startVoice
);


aiCore?.addEventListener(
  "click",
  startVoice
);


aiCore?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {

      event.preventDefault();

      startVoice();

    }

  }
);


/* =========================================================
   TEXT TO SPEECH
========================================================= */

function speak(text) {

  if (
    !("speechSynthesis" in window)
  ) {
    return;
  }


  window.speechSynthesis.cancel();


  const cleanText =
    text
      .replace(
        /[🌹🤖🧠🎙️⚡🔐]/g,
        ""
      )
      .trim();


  const utterance =
    new SpeechSynthesisUtterance(
      cleanText
    );


  utterance.lang =
    state.settings.language === "en"
      ? "en-IN"
      : "hi-IN";


  utterance.rate =
    0.95;

  utterance.pitch =
    1.02;

  utterance.volume =
    1;


  utterance.onstart =
    () => {

      aiCore?.classList.add(
        "speaking"
      );


      setAIState(
        "SPEAKING",
        "GULAB is speaking..."
      );

    };


  utterance.onend =
    () => {

      aiCore?.classList.remove(
        "speaking"
      );


      setAIState(
        "READY",
        "Ready for your command"
      );

    };


  window.speechSynthesis.speak(
    utterance
  );

}


/* =========================================================
   AI STATE
========================================================= */

function setAIState(
  stateName,
  transcript
) {

  if (aiState) {

    aiState.textContent =
      stateName;

  }


  if (aiTranscript) {

    aiTranscript.textContent =
      transcript;

  }


  aiCore?.classList.remove(
    "listening",
    "thinking",
    "speaking"
  );


  const normalized =
    stateName.toLowerCase();


  if (
    normalized === "listening"
  ) {

    aiCore?.classList.add(
      "listening"
    );

  }


  if (
    normalized === "thinking"
  ) {

    aiCore?.classList.add(
      "thinking"
    );

  }


  if (
    normalized === "speaking"
  ) {

    aiCore?.classList.add(
      "speaking"
    );

  }

}


/* =========================================================
   SETTINGS
========================================================= */

function loadSettings() {

  if (assistantNameInput) {

    assistantNameInput.value =
      state.settings.assistantName ||
      "GULAB";

  }


  if (languageInput) {

    languageInput.value =
      state.settings.language ||
      "hi";

  }

}


$("#saveSettings")
  ?.addEventListener(
    "click",
    () => {

      state.settings.assistantName =
        assistantNameInput?.value.trim() ||
        "GULAB";


      state.settings.language =
        languageInput?.value ||
        "hi";


      saveState();


      toast(
        "GULAB system settings saved."
      );

    }
  );


/* =========================================================
   ADD MEMORY BUTTON
========================================================= */

$("#addMemory")
  ?.addEventListener(
    "click",
    () => {

      const text =
        window.prompt(
          "What should GULAB remember?"
        );


      if (!text?.trim()) {
        return;
      }


      addMemory(
        "Personal Memory",
        text
      );


      toast(
        "Memory saved."
      );

    }
  );


/* =========================================================
   CLEAR CHAT
========================================================= */

$("#clearChat")
  ?.addEventListener(
    "click",
    () => {

      clearMessages();

      toast(
        "Conversation cleared."
      );

    }
  );


/* =========================================================
   CLEAR HISTORY
========================================================= */

$("#clearHistory")
  ?.addEventListener(
    "click",
    () => {

      const confirmed =
        window.confirm(
          "Clear all conversation history?"
        );


      if (!confirmed) {
        return;
      }


      state.history =
        [];


      saveState();

      renderHistory();


      toast(
        "History cleared."
      );

    }
  );


/* =========================================================
   SUPABASE CONNECTION TEST
========================================================= */

async function checkSupabaseConnection() {

  if (!supabaseClient) {

    if (connectionStatus) {

      connectionStatus.textContent =
        "LOCAL";

    }

    return false;

  }


  try {

    const {
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {
      throw error;
    }


    if (connectionStatus) {

      connectionStatus.textContent =
        "SUPABASE";

    }


    console.log(
      "🌹 GULAB AI → Supabase connection OK"
    );


    return true;

  } catch (error) {

    console.error(
      "Supabase connection test failed:",
      error
    );


    if (connectionStatus) {

      connectionStatus.textContent =
        "OFFLINE";

    }


    return false;

  }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
   WAIT
========================================================= */

function wait(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initialize() {

  loadSettings();

  updateMemoryUI();

  renderHistory();


  if (aiEngine) {

    aiEngine.textContent =
      "GEMINI";

  }


  if (connectionStatus) {

    connectionStatus.textContent =
      supabaseClient
        ? "CONNECTING..."
        : "LOCAL";

  }


  setAIState(
    "READY",
    "Tap the core to speak"
  );


  await checkSupabaseConnection();


  console.log(
    "🌹 GULAB AI V2 initialized."
  );

}


initialize();
