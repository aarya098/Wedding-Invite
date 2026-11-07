// Paste your deployed Google Apps Script Web app URL between the quotes below.
const RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx4RadbQW3doHZ2dtwav7Tu-sxHm1xbDdZi6ooDk-_K4x6zwD1TOi2lOKGOOXBS64v_WA/exec';

const target = new Date('2026-12-06T11:20:00+05:30').getTime();
const countdown = document.getElementById('countdown');
function tick(){
  if(!countdown) return;
  const d = target - Date.now();
  if(d <= 0){ countdown.innerHTML = '<p class="eyebrow">The wedding day is here</p>'; return; }
  const vals = [Math.floor(d/86400000), Math.floor(d%86400000/3600000), Math.floor(d%3600000/60000), Math.floor(d%60000/1000)];
  const labels = ['Days','Hours','Minutes','Seconds'];
  countdown.innerHTML = vals.map((v,i)=>`<div><strong>${v}</strong><small>${labels[i]}</small></div>`).join('');
}
tick(); setInterval(tick, 1000);

const form = document.getElementById('rsvpForm');
const msg = document.getElementById('rsvpMessage');
let selectedResponse = 'accept';

async function sendRsvp(response){
  if(!form || !form.reportValidity()) return;
  if(!RSVP_ENDPOINT.startsWith('https://script.google.com/macros/s/')){
    msg.textContent = 'The RSVP form is not connected yet. Please ask the website owner to add the Google Apps Script Web app URL.';
    return;
  }
  const name = document.getElementById('guestName').value.trim();
  const guestCount = document.getElementById('guestCount').value;
  const data = new URLSearchParams({name, guestCount, response});
  const buttons = form.querySelectorAll('button');
  buttons.forEach(b => b.disabled = true);
  msg.textContent = 'Submitting your response…';
  try {
    // no-cors avoids a browser preflight; Google Apps Script receives the form data.
    // The opaque browser response cannot confirm the sheet write, so we do not claim verification.
    await fetch(RSVP_ENDPOINT, {method:'POST', mode:'no-cors', body:data});
    msg.textContent = `Thank you, ${name}! Your response has been sent. If you need to change it, please contact the family.`;
    form.reset();
  } catch (err) {
    msg.textContent = 'We could not send your response. Please try again or contact the family directly.';
  } finally {
    buttons.forEach(b => b.disabled = false);
  }
}

if(form){
  form.addEventListener('submit', e => { e.preventDefault(); sendRsvp('accept'); });
  const decline = document.getElementById('decline');
  if(decline) decline.addEventListener('click', () => sendRsvp('decline'));
}
