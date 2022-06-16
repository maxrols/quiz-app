"use strict";

const main = document.querySelector(".main");
const selection = document.querySelector('.selection');
const title = document.querySelector('.main__title');

const getData = () => {
    return fetch('db/quiz_db.json').then(response => response.json());
};


const shuffle = array => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const saveResult = (result, id) => {
    localStorage.setItem(id, result);
};

const loadResult = id => localStorage.getItem(id);

const showElem = (elem) => {
    let opacity = 0;
    elem.opacity = opacity;
    elem.style.display = '';

    
    const animation = () => {
        opacity += 0.02;
        elem.style.opacity = opacity;
        if (opacity > 1) {
            clearInterval(id);
        }
    }
    let id = setInterval(animation, 5);
};

const hideElem = (elem, cb) => {
    let opacity = getComputedStyle(elem).opacity;
    let id = setInterval(animation, 5);
    function animation() {
        opacity -= 0.02;
        elem.style.opacity = opacity;
        if (opacity < 0) {
            clearInterval(id);
            elem.style.display = 'none';
            if (cb) cb();
        }
    }

    
};

const renderTheme = themes => {
    const list = document.querySelector('.selection__list');
    list.textContent = "";

    const buttons = [];

    for (let i = 0; i < themes.length; i++) {
        const li = document.createElement('li');
        li.classList.add('selection__item');
        
        const button = document.createElement('button');
        button.classList.add('selection__theme');
        button.dataset.id = themes[i].id;
        button.textContent = themes[i].theme;
        li.append(button);

        const result = loadResult(themes[i].id);
        if (result) {
            const p = document.createElement('p');
            p.classList.add('selection__result');
            p.innerHTML = `
                <span class="selection__result-ratio">${result}/${themes[i].list.length}</span>
                <span class="selection__result-text">Последний результат</span>
            `;
            li.append(p);
        }
        list.append(li);
        buttons.push(button);
    }
    return buttons;
};

const createKeyAnswers = data => {
    const keys = [];

    for (let i = 0; i < data.answers.length; i++) {
        if (data.type === 'radio') {
            keys.push([data.answers[i], !i]);
        } else {
            keys.push([data.answers[i], i < data.correct])
        }
    }
    
    return shuffle(keys);
};

const createAnswer = data => {
    const type = data.type;
    const answers = createKeyAnswers(data);
    console.log(answers);

    const labels = answers.map((item, i) => {
        const label = document.createElement('label');
        label.classList.add('answer');
        const input = document.createElement('input');
        input.type = type;
        input.name = "answer";
        input.className = `answer__${type}`;
        input.value = i;

        const text = document.createTextNode(item[0]);
        label.append(input, text);

        return label;
    });

    const keys = answers.map(answer => answer[1]);

    return {
        labels,
        keys
    };
};

const showResult = (result, quiz) => {
    const block = document.createElement('div');
    block.classList.add('main__box', 'main__box_result', 'result');

    const percent = result / quiz.list.length * 100;

    let ratio = 0;

    for (let i = 0; i < quiz.result.length; i++) {
        if (percent >= quiz.result[i][0]) {
            ratio = i;
        }
    }

    block.innerHTML = `
    <h2 class="main__subtitle main__subtitle_result">
        Ваш результат
    </h2>
    <div class="result__box">
        <p class="result__ratio result__ratio_${ratio + 1}">${result}/${quiz.list.length}</p>
        <p class="result__text">${quiz.result[ratio][1]}</p>
    </div>
    `;

    const button = document.createElement('button');
    button.classList.add('main__btn', 'result__return');
    button.textContent = 'К списку квизов';

    block.append(button);

    setTimeout(() => {
        main.append(block);
    }, 250);

    button.addEventListener('click', () => {
        hideElem(block, () => {
            showElem(title);
            showElem(selection);
            initQuiz();
        })
    });

    
};

const renderQuiz = quiz => {
    hideElem(title);
    hideElem(selection);

    const questionBox = document.createElement('div');
    questionBox.classList.add('main__box', 'main__box_question');

    setTimeout(() => {
        main.append(questionBox);
    }, 250);

    let result = 0;
    let questionCount = 0;

    const showQuestion = () => {
        const data = quiz.list[questionCount];
        questionCount++;
        
        questionBox.textContent = '';

        const form = document.createElement('form');
        form.classList.add('main__form-question');
        form.dataset.count = `${questionCount}/${quiz.list.length}`;

        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.classList.add('main__subtitle');
        legend.textContent = data.question;

        const answersData = createAnswer(data);

        const button = document.createElement('button');
        button.classList.add('main__btn', 'question__next');
        button.type = 'submit';
        button.textContent = "Подтвердить";

        fieldset.append(legend, ...answersData.labels);
        form.append(fieldset, button);

        questionBox.append(form);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let ok = false;

            const answer = [...form.answer].map((input) => {
                if (input.checked) ok = true;
                return input.checked ? input.value : false;
            });

            if (ok) {
                const r = answer.every((result, i) => {
                    return !!result === answersData.keys[i];
                });

                if (r) {
                    result++;
                }

                if (questionCount < quiz.list.length){
                    showQuestion();
                } else {
                    hideElem(questionBox);
                    showResult(result, quiz);
                    saveResult(result, quiz.id);
                }
            } else {
                form.classList.add('main__form-question_error');
                setTimeout(() => {
                    form.classList.remove('main__form-question_error');
                }, 1000)
            }
        })
    };
    showQuestion();
};

const addClick = (buttons, data) => {
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const quiz = data.find(item => item.id === btn.dataset.id);
            renderQuiz(quiz);
        });
    });
};

const initQuiz = async () => {
    const data = await getData();
    console.log(data);

    const buttons = renderTheme(data);
    console.log(buttons);

    addClick(buttons, data);
};

initQuiz();