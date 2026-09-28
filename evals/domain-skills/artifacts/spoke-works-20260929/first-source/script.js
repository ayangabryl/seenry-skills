const services={flat:{name:'Flat repair',price:'$24'},brake:{name:'Brake adjustment',price:'$38'},tune:{name:'Standard tune',price:'$95'}};
const slots={thu1030:'Thu 1 Oct 2026 · 10:30',thu1500:'Thu 1 Oct 2026 · 15:00',fri0930:'Fri 2 Oct 2026 · 09:30',fri1400:'Fri 2 Oct 2026 · 14:00'};
const form=document.querySelector('#booking');
const reviewButton=document.querySelector('#review-button');
const reviewDialog=document.querySelector('#review-dialog');
const confirmationDialog=document.querySelector('#confirmation-dialog');
let lastFocus=null;
function selection(){const data=new FormData(form);return {service:services[data.get('service')],slot:slots[data.get('slot')]};}
function updateSelection(){const {service,slot}=selection();document.querySelector('#summary-service').textContent=service?.name??'Not chosen';document.querySelector('#summary-price').textContent=service?.price??'—';document.querySelector('#summary-slot').textContent=slot??'Not chosen';reviewButton.disabled=!(service&&slot);}
form.addEventListener('change',updateSelection);
form.addEventListener('submit',event=>{event.preventDefault();const {service,slot}=selection();if(!service||!slot)return;lastFocus=document.activeElement;document.querySelector('#review-service').textContent=service.name;document.querySelector('#review-price').textContent=service.price;document.querySelector('#review-slot').textContent=slot;reviewDialog.showModal();});
document.querySelector('#close-review').addEventListener('click',()=>reviewDialog.close());
document.querySelector('#edit-choice').addEventListener('click',()=>reviewDialog.close());
reviewDialog.addEventListener('close',()=>lastFocus?.focus());
document.querySelector('#confirm-demo').addEventListener('click',()=>{const {service,slot}=selection();if(!service||!slot)return;document.querySelector('#confirmation-details').textContent=`${service.name} (${service.price}) · ${slot}.`;reviewDialog.close();confirmationDialog.showModal();});
document.querySelector('#close-confirmation').addEventListener('click',()=>confirmationDialog.close());
document.querySelector('#start-over').addEventListener('click',()=>{confirmationDialog.close();form.reset();updateSelection();document.querySelector('#demo').scrollIntoView();form.querySelector('input[name="service"]').focus();});
confirmationDialog.addEventListener('close',()=>reviewButton.focus());
updateSelection();
