(function(){"use strict";const R=["למכירה","להשכרה","חדרים","שיווק","מבוקש","קומה",'מ"ר',"מ״ר","מר","דירה","פנטהאוז","דופלקס","גג","גן","רחוב","רח","טאבו","בלעדיות"],p=new Set,_=5e3,y="realtor-crm-sync-button",x="realtor-crm-sync-container";let w="";function l(e){return e?e.replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g,"").trim():""}function q(e){if(!e)return[];const n=[],r=e.toLowerCase();for(const o of R){const t=o.toLowerCase();r.includes(t)&&n.push(o)}return n}async function S(){try{const n=(await chrome.storage.local.get("monitored_groups")).monitored_groups;return Array.isArray(n)?n.map(r=>typeof r=="string"?l(r):r&&typeof r=="object"&&r.title?l(r.title):"").filter(Boolean):[]}catch(e){return console.error("[Realtor CRM] Failed to read monitored_groups from storage:",e),[]}}async function b(e){if(!e)return!1;const n=l(e).toLowerCase();return(await S()).some(o=>o.toLowerCase()===n)}async function E(e){const n=l(e);if(!n)return!1;const r=await S(),o=n.toLowerCase(),t=r.findIndex(a=>a.toLowerCase()===o);let i=!1;return t>=0?(r.splice(t,1),i=!1):(r.push(n),i=!0),await chrome.storage.local.set({monitored_groups:r}),console.log(`[Realtor CRM] Monitored group "${n}" toggled -> ${i?"ACTIVE":"INACTIVE"}`),i}function h(){const e=document.querySelector("#main")||document.querySelector('div[role="region"]');if(!e)return"";const n=['header span[data-testid="conversation-info-header-chat-title"]','header [data-testid="chat-title"]','header [data-testid="conversation-title"]','header span[dir="auto"][title]','header h2 span[dir="auto"]','header div[role="button"] span[dir="auto"]',"header span.title"];for(const o of n){const t=e.querySelector(o);if(t){const i=t.getAttribute("title")||t.textContent||"",a=l(i);if(a)return a}}const r=e.querySelector("header");if(r){const o=r.querySelectorAll('span[dir="auto"]');for(const t of Array.from(o)){const i=l(t.textContent||"");if(i&&!i.includes(":")&&i.length>1)return i}}return""}function C(){const e=document.querySelector("#main")||document.querySelector('div[role="region"]');return e?e.querySelector('header[data-testid="conversation-header"]')||e.querySelector("header"):null}async function g(){const e=C(),n=h();if(!e||!n)return;w=n;const r=await b(n);let o=document.getElementById(x),t=document.getElementById(y);if(!o||!t||!e.contains(o)){o==null||o.remove(),o=document.createElement("div"),o.id=x,o.style.cssText=`
      display: inline-flex;
      align-items: center;
      margin: 0 10px;
      vertical-align: middle;
      z-index: 100;
    `,t=document.createElement("button"),t.id=y,t.setAttribute("type","button"),t.addEventListener("click",async a=>{a.stopPropagation(),a.preventDefault(),t.disabled=!0,t.style.opacity="0.7";const d=h();if(d){const u=await E(d);v(t,u,d)}t.disabled=!1,t.style.opacity="1"}),o.appendChild(t);const i=e.querySelector('div[data-testid="conversation-header-actions"]')||e.querySelector('div[role="toolbar"]')||e.lastElementChild;i&&i.parentElement===e?e.insertBefore(o,i):e.appendChild(o)}v(t,r,n)}function v(e,n,r){const o=`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    line-height: 1.4;
    white-space: nowrap;
    direction: rtl;
  `;n?(e.style.cssText=`
      ${o}
      background-color: #059669;
      color: #ffffff;
      border: 1px solid #047857;
      box-shadow: 0 2px 4px rgba(5, 150, 105, 0.25);
    `,e.innerHTML=`
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>סנכרון פעיל ל-CRM</span>
    `,e.title=`קבוצה זו ("${r}") מנוטרת ע״י Realtor CRM. לחץ לביטול סנכרון.`):(e.style.cssText=`
      ${o}
      background-color: rgba(248, 250, 252, 0.95);
      color: #475569;
      border: 1px solid #cbd5e1;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    `,e.innerHTML=`
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      <span>סנכרן ל-CRM</span>
    `,e.title=`לחץ לניטור קבוצה זו ("${r}") והעברת מודעות נדל״ן ישירות ל-CRM.`)}function I(e,n){let r="";const o=[".copyable-text span.selectable-text","span.selectable-text",".copyable-text",'span[dir="ltr"]','span[dir="rtl"]','span[dir="auto"]'];for(const s of o){const c=e.querySelector(s);if(c){const M=c.textContent||"";M.trim().length>r.length&&(r=M.trim())}}let t="",i="",a="";const u=(e.querySelector("[data-pre-plain-text]")||e).getAttribute("data-pre-plain-text");if(u){const s=u.match(/\[(.*?)\]\s*(.*?):\s*$/);if(s){a=s[1].trim();const c=s[2].trim();/^[\d+\s\-()]{7,}$/.test(c)&&(i=c),t=c}}if(!t){const s=e.querySelector('span[data-testid="author"]')||e.querySelector('span[data-testid="chat-author"]')||e.querySelector('div[data-testid="author"]');s&&s.textContent&&(t=l(s.textContent))}if(!a){const s=e.querySelector('div[data-testid="msg-meta"] span')||e.querySelector('span[data-testid="msg-meta"]')||e.querySelector('[data-testid="msg-meta"]');s&&s.textContent&&(a=l(s.textContent))}return{id:e.getAttribute("data-id")||""||`wa_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,rawText:l(r),senderName:t||"חבר קבוצה",senderPhone:i||void 0,timestamp:a||new Date().toISOString(),groupTitle:n}}async function T(e){var m;if(e.classList.contains("message-out")||!!e.closest(".message-out")||!!((m=e.getAttribute("data-id"))!=null&&m.startsWith("true_")))return;const r=e.getAttribute("data-id")||"";if(r&&p.has(r))return;const o=h();if(!o)return;const t=I(e,o);if(!t.rawText||t.rawText.length<10)return;const i=r||`${o}_${t.senderName}_${t.timestamp}_${t.rawText.slice(0,30)}`;if(p.has(i))return;if(p.add(i),r&&p.add(r),p.size>_){const f=p.values();for(let s=0;s<500;s++){const c=f.next().value;if(c!==void 0)p.delete(c);else break}}const a=q(t.rawText);if(a.length===0||!await b(o))return;const u={id:t.id,rawText:t.rawText,senderName:t.senderName,senderPhone:t.senderPhone,timestamp:t.timestamp,groupTitle:o,matchedKeywords:a,receivedAt:new Date().toISOString(),source:"whatsapp"};console.log("%c[Realtor CRM Companion] 🏠 Real Estate Announcement Detected!","color: #059669; font-weight: bold; font-size: 12px;",`
Group: "${o}"`,`
Sender: ${t.senderName}`,`
Keywords: [${a.join(", ")}]`,`
Text: ${t.rawText.slice(0,100)}...`);try{const f={type:"NEW_WHATSAPP_MESSAGE",payload:u};chrome.runtime.sendMessage(f)}catch(f){console.warn("[Realtor CRM] Error forwarding message to background worker:",f)}}function A(){console.log("[Realtor CRM Companion] WhatsApp Web Observer initialized."),new MutationObserver(n=>{var o,t;let r=!1;for(const i of n)if(i.type==="childList"){for(const a of Array.from(i.addedNodes))if(a instanceof HTMLElement&&((a.tagName==="HEADER"||a.querySelector("header")||a.id==="main"||a.getAttribute("role")==="region")&&(r=!0),a.classList.contains("message-in")||a.hasAttribute("data-id")||(o=a.querySelector)!=null&&o.call(a,"div[data-id], .message-in"))){T(a);const d=(t=a.querySelectorAll)==null?void 0:t.call(a,"div[data-id], .message-in");d==null||d.forEach(u=>T(u))}}r&&g()}).observe(document.body,{childList:!0,subtree:!0}),setInterval(()=>{const n=h();(n&&n!==w||!document.getElementById(y)&&C())&&g()},1e3),chrome.storage.onChanged.addListener((n,r)=>{r==="local"&&n.monitored_groups&&(console.log("[Realtor CRM] Storage updated monitored_groups -> refreshing button state"),g())}),g()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",A):A()})();
