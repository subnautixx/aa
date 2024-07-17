import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, onSnapshot, limit } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

const firebaseConfig = {
    // Suas configurações do Firebase aqui
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const perguntas = [
    "O que define a realidade?", "Podemos confiar em nossa percepção?", "Existe um propósito universal para a vida?",
    "O que é a consciência?", "O livre-arbítrio realmente existe?", "O que torna uma ação moral?",
    "Podemos conhecer algo com certeza absoluta?", "O que é a verdade?", "A felicidade é o objetivo final da vida?",
    "A mente e o corpo são separados?", "O que significa viver uma boa vida?", "Existe vida após a morte?",
    "A arte pode ser objetivamente avaliada?", "O que é mais real: pensamentos ou sentimentos?",
    "O universo tem um fim?", "A inteligência artificial pode se tornar consciente?",
    "Podemos provar a existência de um deus?", "O que nos faz humanos?", "Existe um significado inerente no universo?",
    "Como podemos definir a beleza?", "A tecnologia melhora fundamentalmente a condição humana?",
    "A natureza humana é inerentemente boa ou má?", "Podemos experimentar algo objetivamente, ou tudo é subjetivo?",
    "Qual é a verdadeira natureza do amor?", "O que é justiça?", "É possível alcançar a verdadeira paz?",
    "A beleza está nos olhos de quem vê?", "Até que ponto somos moldados pela nossa cultura?",
    "Existe uma linguagem universal?", "O que nos motiva mais: medo ou amor?",
    "A inteligência ou a sabedoria é mais valiosa?", "O que significa ser corajoso?",
    "A solidão é sempre negativa?", "Por que sonhamos?", "O que é mais importante: a jornada ou o destino?",
    "A ética é relativa ou universal?", "Podemos ser éticos sem religião?", "O que é liberdade?",
    "Qual é o papel da arte na sociedade?", "A memória define quem somos?",
    "Existe vida em outros planetas?", "O que faz uma sociedade ser justa?",
    "A história é um ciclo ou uma linha reta?", "Podemos ser verdadeiramente altruístas?",
    "O que é mais real: matéria ou mente?", "A ciência pode explicar tudo?",
    "A felicidade é um direito ou um privilégio?", "A pobreza é um problema de recursos ou de distribuição?",
    "A diversidade é uma força ou um desafio?", "O que significa ser autoconsciente?"
];

document.addEventListener('DOMContentLoaded', () => {
    const perguntaEl = document.getElementById('pergunta');
    const userInput = document.getElementById('userInput');
    const submitBtn = document.getElementById('submitBtn');
    const responseBox = document.getElementById('responseBox');
    const charCount = document.getElementById('charCount');
    const themeToggle = document.getElementById('themeToggle');
    const infoButton = document.getElementById('infoButton');
    const infoModal = document.getElementById('infoModal');
    const closeModal = document.querySelector('.close');
    const prevQuestionBtn = document.getElementById('prevQuestion');
    const nextQuestionBtn = document.getElementById('nextQuestion');
    const questionDateEl = document.getElementById('questionDate');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    let currentQuestionIndex = 0;
    let lastVisible = null;

    function exibirPerguntaAtual() {
        const dataInicio = new Date('2023-11-23');
        const hoje = new Date();
        const diferencaTempo = hoje - dataInicio;
        const diferencaDias = Math.floor(diferencaTempo / (1000 * 3600 * 24));
        currentQuestionIndex = diferencaDias % perguntas.length;
        perguntaEl.textContent = perguntas[currentQuestionIndex];
        atualizarDataPergunta(hoje);
    }

    function atualizarDataPergunta(data) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        questionDateEl.textContent = data.toLocaleDateString('pt-BR', options);
    }

    function mudarPergunta(direcao) {
        const novaData = new Date();
        novaData.setDate(novaData.getDate() + direcao);
        const dataInicio = new Date('2023-11-23');
        const diferencaTempo = novaData - dataInicio;
        const diferencaDias = Math.floor(diferencaTempo / (1000 * 3600 * 24));
        currentQuestionIndex = diferencaDias % perguntas.length;
        if (currentQuestionIndex < 0) currentQuestionIndex += perguntas.length;
        perguntaEl.textContent = perguntas[currentQuestionIndex];
        atualizarDataPergunta(novaData);
    }

    function generateUserId() {
        return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, function(c) {
            const r = Math.random() * 16 | 0;
            return r.toString(16);
        });
    }

    function getUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = generateUserId();
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    const userId = getUserId();

    function addResponseToDOM(text, animate = false) {
        const newResponse = document.createElement('div');
        newResponse.textContent = text;
        newResponse.classList.add('response');
        if (animate) {
            newResponse.style.opacity = '0';
            newResponse.style.transform = 'translateY(20px)';
        }
        responseBox.appendChild(newResponse);
        if (animate) {
            setTimeout(() => {
                newResponse.style.transition = 'opacity 0.5s, transform 0.5s';
                newResponse.style.opacity = '1';
                newResponse.style.transform = 'translateY(0)';
            }, 10);
        }
    }

    async function canUserPost() {
        const thirtyMinutesAgo = new Date(Date.now() - (30 * 60000));
        const q = query(collection(db, "responses"), 
                        where("userId", "==", userId), 
                        where("timestamp", ">=", thirtyMinutesAgo));
        const querySnapshot = await getDocs(q);
        return querySnapshot.size < 3;
    }

    async function addResponse() {
        const responseText = userInput.value.trim();
        if (responseText.length > 0 && responseText.length <= 250) {
            try {
                const canPost = await canUserPost();
                if (canPost) {
                    await addDoc(collection(db, "responses"), {
                        userId: userId,
                        text: responseText,
                        timestamp: new Date(),
                        questionIndex: currentQuestionIndex
                    });
                    addResponseToDOM(responseText, true);
                    userInput.value = '';
                    updateCharCount();
                    submitBtn.classList.add('pulse');
                    setTimeout(() => submitBtn.classList.remove('pulse'), 2000);
                } else {
                    alert("Você só pode enviar 3 respostas a cada 30 minutos.");
                }
            } catch (error) {
                console.error("Error adding response: ", error);
                alert("Ocorreu um erro ao enviar sua resposta. Por favor, tente novamente.");
            }
        } else {
            alert("Por favor, digite uma resposta (máximo de 250 caracteres) antes de enviar.");
        }
    }

    function loadResponses(loadMore = false) {
        let q;
        if (loadMore && lastVisible) {
            q = query(collection(db, "responses"), 
                      where("questionIndex", "==", currentQuestionIndex),
                      orderBy("timestamp", "desc"), 
                      startAfter(lastVisible),
                      limit(5));
        } else {
            responseBox.innerHTML = '';
            q = query(collection(db, "responses"), 
                      where("questionIndex", "==", currentQuestionIndex),
                      orderBy("timestamp", "desc"), 
                      limit(5));
        }

        getDocs(q).then((querySnapshot) => {
            if (querySnapshot.empty) {
                loadMoreBtn.style.display = 'none';
                if (!loadMore) {
                    const noResponses = document.createElement('p');
                    noResponses.textContent = "Ainda não há respostas para esta pergunta. Seja o primeiro a compartilhar sua perspectiva!";
                    responseBox.appendChild(noResponses);
                }
            } else {
                querySnapshot.forEach((doc) => {
                    addResponseToDOM(doc.data().text, loadMore);
                });
                lastVisible = querySnapshot.docs[querySnapshot.docs.length-1];
                loadMoreBtn.style.display = 'block';
            }
        });
    }

    function updateCharCount() {
        const currentLength = userInput.value.length;
        charCount.textContent = `${currentLength} / 250`;
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const icon = themeToggle.querySelector('i');
        icon.classList.toggle('fa-sun');
        icon.classList.toggle('fa-moon');
    }

    exibirPerguntaAtual();
    submitBtn.addEventListener('click', addResponse);
    userInput.addEventListener('input', updateCharCount);
    themeToggle.addEventListener('click', toggleTheme);
    infoButton.addEventListener('click', () => infoModal.style.display = "block");
    closeModal.addEventListener('click', () => infoModal.style.display = "none");
    window.addEventListener('click', (event) => {
        if (event.target == infoModal) {
            infoModal.style.display = "none";
        }
    });
    prevQuestionBtn.addEventListener('click', () => mudarPergunta(-1));
    nextQuestionBtn.addEventListener('click', () => mudarPergunta(1));
    loadMoreBtn.addEventListener('click', () => loadResponses(true));

    loadResponses();
});