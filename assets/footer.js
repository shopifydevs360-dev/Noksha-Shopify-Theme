document.addEventListener('click', (e) => {
  const trigger = e.target.closest('.js-toggle-trigger');
  if (!trigger || window.innerWidth > 991) return;

  const wrapper = trigger.parentElement;
  if (!wrapper) return;

  const content = wrapper.querySelector('.toggle-content');
  if (!content) return;

  // Toggle classes
  trigger.classList.toggle('toggle-active');
  content.classList.toggle('content-open');
});
