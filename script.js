const steps = ['step-1', 'step-2', 'step-3'];
let currentStep = 0;

// Твои расценки (можешь поменять цифры)
const prices = {
    'профнастил': 2500,
    'евроштакетник': 3200,
    '3d': 1800,
    'секционный': 4500
};

function updateStepUI() {
    // Показываем/скрываем шаги
    steps.forEach((stepId, index) => {
        const el = document.getElementById(stepId);
        if (el) el.classList.toggle('hidden', index !== currentStep);

        // Обновляем точки прогресса
        const dot = document.getElementById(`progress-dot-${index + 1}`);
        const text = document.getElementById(`progress-text-${index + 1}`);
        if (dot) {
            if (index <= currentStep) {
                dot.classList.add('bg-primary', 'text-on-primary');
                dot.classList.remove('bg-surface-container-highest', 'text-zinc-400');
            } else {
                dot.classList.remove('bg-primary', 'text-on-primary');
                dot.classList.add('bg-surface-container-highest', 'text-zinc-400');
            }
        }
    });

    // Управление кнопками
    const nextBtn = document.getElementById('next-btn');
    if (currentStep === steps.length - 1) {
        nextBtn.innerText = 'Отправить заявку';
    } else {
        nextBtn.innerText = 'Далее';
    }
}

// Слушатель для кнопки "Далее"
document.getElementById('next-btn').addEventListener('click', () => {
    if (currentStep < steps.length - 1) {
        // Проверка: выбран ли тип забора на 1 шаге
        if (currentStep === 0 && !document.getElementById('fence_type').value) {
            alert('Пожалуйста, выберите тип забора');
            return;
        }
        currentStep++;
        updateStepUI();
    } else {
        // Здесь форма отправится на Netlify автоматически
        document.querySelector('form').submit();
    }
});

// Живой расчет в блоке "Ваша конфигурация"
function calculate() {
    const type = document.getElementById('fence_type').value;
    const len = parseFloat(document.getElementById('length').value) || 0;
    const height = parseFloat(document.getElementById('height').value) || 0;
    
    const price = prices[type] || 0;
    const total = len * height * price;

    const summary = document.getElementById('config-summary');
    if (summary) {
        summary.innerHTML = `
            <div class="flex justify-between text-sm"><span class="text-zinc-500">Забор:</span><span class="text-zinc-200">${type || '—'}</span></div>
            <div class="flex justify-between text-sm"><span class="text-zinc-500">Площадь:</span><span class="text-zinc-200">${(len * height).toFixed(1)} м²</span></div>
            <div class="pt-4 mt-4 border-t border-outline-variant/20 flex flex-col gap-2">
                <span class="text-zinc-500 text-xs">Предварительно:</span>
                <span class="text-2xl font-bold text-white">${total.toLocaleString()} ₽</span>
            </div>
        `;
    }
}

// Привязываем расчет к полям ввода
['fence_type', 'length', 'height'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculate);
});

// Мобильное меню
document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('mobile-nav').classList.toggle('hidden');
});

updateStepUI();
