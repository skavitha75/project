/* Improved frontend-only chat with localStorage per contact.
   - multiple contacts
   - persist messages in localStorage
   - contact switching
   - simulated auto-reply for demo
*/

const contacts = [
  { id: "alice", name: "Alice", color: "#28a745", subtitle: "Online" },
  { id: "bob", name: "Bob", color: "#007bff", subtitle: "Away" },
  { id: "charlie", name: "Charlie", color: "#ff9800", subtitle: "Busy" },
  { id: "david", name: "David", color: "#673ab7", subtitle: "Offline" },
  { id: "eve", name: "Eve", color: "#e91e63", subtitle: "Online" },
  { id: "frank", name: "Frank", color: "#003cff", subtitle: "Offline" },
  { id: "grace", name: "Grace", color: "#009688", subtitle: "Online" }
];

const CONTACTS_KEY = "chat_ui_contacts_v1"; // not strictly needed but reserved
const STORAGE_KEY = "chat_ui_messages_v1";

const contactsList = document.getElementById("contactsList");
const chatHeader = document.getElementById("chatHeader");
const chatWindow = document.getElementById("chatWindow");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");
const clearStorageBtn = document.getElementById("clearStorage");

let activeContactId = null;
let messages = loadMessages(); // object: { contactId: [ { sender:'me'|'them', text, t } ] }

// --- initialize contacts UI
function initContacts(){
  contactsList.innerHTML = "";
  contacts.forEach(c => {
    const li = document.createElement("li");
    li.className = "contact";
    li.dataset.id = c.id;
    li.innerHTML = `
      <div class="avatar" style="background:${c.color}">${c.name.charAt(0)}</div>
      <div style="min-width:0">
        <div class="title">${c.name}</div>
        <div class="subtitle">${c.subtitle}</div>
      </div>`;
    li.addEventListener("click", () => selectContact(c.id));
    contactsList.appendChild(li);
  });
}

// --- load messages from localStorage or seed defaults
function loadMessages(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try { return JSON.parse(raw); } catch(e){ console.warn("bad json", e); }
  }
  // seed sample conversation for Alice
  return {
    alice: [
      { sender: "them", text: "Hi!", t: Date.now() - 1000*60*60 },
      { sender: "me", text: "Hi Alice!", t: Date.now() - 1000*60*60 + 15000 },
      { sender: "me", text: "How are you?", t: Date.now() - 1000*60*60 + 30000 },
      { sender: "them", text: "I'm good, thanks! How about you?", t: Date.now() - 1000*60*60 + 45000 },
      { sender: "me", text: "Good, thank you!", t: Date.now() - 1000*60*60 + 60000 }
    ]
  };
}

function saveMessages(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

// --- select contact
function selectContact(id){
  activeContactId = id;
  // highlight active contact
  document.querySelectorAll(".contact").forEach(el => el.classList.toggle("active", el.dataset.id === id));
  // set header
  const c = contacts.find(x=>x.id===id);
  chatHeader.textContent = `Chat with ${c ? c.name : id}`;
  // render messages
  renderMessages();
  // focus input
  setTimeout(()=> messageInput.focus(), 120);
}

// --- render messages for active contact
function renderMessages(){
  if(!activeContactId) return;
  chatWindow.innerHTML = ""; // clear
  const arr = messages[activeContactId] || [];
  arr.forEach(msg => {
    const node = createMessageNode(msg);
    chatWindow.appendChild(node);
  });
  // add typing indicator node at end (hidden by default)
  chatWindow.appendChild(typingIndicator);
  scrollToBottom();
}

// --- create message DOM node
function createMessageNode(msg){
  const d = document.createElement("div");
  d.className = "msg " + (msg.sender === "me" ? "sent" : "received");
  d.textContent = msg.text;
  // small timestamp (optional)
  const ts = document.createElement("div");
  ts.className = "ts";
  const date = new Date(msg.t);
  ts.textContent = date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  d.appendChild(ts);
  return d;
}

function scrollToBottom(){
  chatWindow.scrollTop = chatWindow.scrollHeight + 200;
}

// --- send message
function sendMessage(){
  const txt = messageInput.value.trim();
  if(!txt || !activeContactId) return;
  const msg = { sender: "me", text: txt, t: Date.now() };
  messages[activeContactId] = messages[activeContactId] || [];
  messages[activeContactId].push(msg);
  saveMessages();

  // render appended msg
  chatWindow.insertBefore(createMessageNode(msg), typingIndicator);
  messageInput.value = "";
  scrollToBottom();

  // simulated typing + auto-reply for demo
  simulateAutoReply(activeContactId, txt);
}

// --- simulate contact typing and a canned reply (small and optional)
function simulateAutoReply(contactId, lastUserMsg){
  // show typing indicator
  typingIndicator.classList.remove("hidden");
  scrollToBottom();

  // simple canned responses; keep it harmless & short
  const replies = [
    "Nice!",
    "Sounds good.",
    "Okay, thanks!",
    "Haha, got it.",
    "That's interesting.",
    "I agree.",
    "Good to hear!"
  ];
  // decide reply after 800-1600ms
  const delay = 700 + Math.random()*900;

  setTimeout(()=>{
    typingIndicator.classList.add("hidden");
    // don't add reply if user switched contacts meanwhile? still push to that contact
    const replyText = replies[Math.floor(Math.random()*replies.length)];
    const reply = { sender: "them", text: replyText, t: Date.now() };
    messages[contactId] = messages[contactId] || [];
    messages[contactId].push(reply);
    saveMessages();
    // if still viewing same contact, render it
    if(activeContactId === contactId){
      chatWindow.insertBefore(createMessageNode(reply), typingIndicator);
      scrollToBottom();
    }
  }, delay);
}

// --- events
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// clear storage (dev)
clearStorageBtn.addEventListener("click", () => {
  if(!confirm("Clear all saved chats?")) return;
  localStorage.removeItem(STORAGE_KEY);
  messages = {};
  // reset UI state: select first contact
  selectContact(contacts[0].id);
});

// init
initContacts();
selectContact(contacts[0].id);

// ensure typing indicator exists in DOM reference (we appended it earlier sometimes)
(function findTyping(){
  const el = document.getElementById("typingIndicator");
  if(!el){
    const t = document.createElement("div");
    t.id = "typingIndicator";
    t.className = "typing-indicator hidden";
    t.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatWindow.appendChild(t);
  }
})();
