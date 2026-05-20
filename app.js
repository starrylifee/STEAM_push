// STEAM 도형 밀기 나라 (STEAM Shape Pushing Land) - Core Javascript Logic (Improved Grid Translation & Gameplay Refactor)

// ==========================================================================
// 1. Web Audio API Sound Synthesizer
// ==========================================================================
class SoundSynth {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    createOscillator(type, freq, duration, gainStart, gainEnd = 0.001) {
        if (this.muted || !this.ctx) return null;
        this.init();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gainNode.gain.setValueAtTime(gainStart, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(gainEnd, this.ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        return { osc, gainNode };
    }

    playSelect() {
        const synth = this.createOscillator('sine', 523.25, 0.1, 0.15); // C5
        if (!synth) return;
        synth.osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
        synth.osc.start();
        synth.osc.stop(this.ctx.currentTime + 0.1);
    }

    playMove() {
        const synth = this.createOscillator('triangle', 220, 0.12, 0.2); // A3
        if (!synth) return;
        synth.osc.frequency.linearRampToValueAtTime(330, this.ctx.currentTime + 0.12);
        synth.osc.start();
        synth.osc.stop(this.ctx.currentTime + 0.12);
    }

    playSuccess() {
        const now = this.ctx ? this.ctx.currentTime : 0;
        const note1 = this.createOscillator('sine', 659.25, 0.1, 0.15);
        if (!note1) return;
        note1.osc.start();
        note1.osc.stop(now + 0.1);

        setTimeout(() => {
            const note2 = this.createOscillator('sine', 783.99, 0.18, 0.15);
            if (!note2) return;
            note2.osc.start();
            note2.osc.stop(this.ctx.currentTime + 0.18);
        }, 80);
    }

    playFailure() {
        const synth = this.createOscillator('sawtooth', 130.81, 0.25, 0.2); // C3
        if (!synth) return;
        synth.osc.frequency.linearRampToValueAtTime(85, this.ctx.currentTime + 0.25);
        synth.osc.start();
        synth.osc.stop(this.ctx.currentTime + 0.25);
    }

    playSew() {
        const synth = this.createOscillator('triangle', 987.77, 0.08, 0.15); // B5
        if (!synth) return;
        synth.osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.08);
        synth.osc.start();
        synth.osc.stop(this.ctx.currentTime + 0.08);
    }

    playLiquid() {
        if (this.muted || !this.ctx) return;
        this.init();
        const baseFreq = 300;
        
        for (let i = 0; i < 6; i++) {
            const timeOffset = i * 0.08;
            setTimeout(() => {
                const pitch = baseFreq + i * 80 + Math.random() * 30;
                const bubble = this.createOscillator('sine', pitch, 0.08, 0.1, 0.01);
                if (bubble) {
                    bubble.osc.start();
                    bubble.osc.stop(this.ctx.currentTime + 0.08);
                }
            }, timeOffset * 1000);
        }
    }

    playWin() {
        if (this.muted || !this.ctx) return;
        this.init();
        const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; // C5, E5, G5, C6, E6, G6, C7
        
        melody.forEach((freq, index) => {
            setTimeout(() => {
                const note = this.createOscillator('sine', freq, 0.25, 0.15);
                if (note) {
                    note.osc.start();
                    note.osc.stop(this.ctx.currentTime + 0.25);
                }
            }, index * 80);
        });
    }

    playLose() {
        if (this.muted || !this.ctx) return;
        this.init();
        const melody = [392.00, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
        
        melody.forEach((freq, index) => {
            setTimeout(() => {
                const note = this.createOscillator('triangle', freq, 0.3, 0.2);
                if (note) {
                    note.osc.frequency.linearRampToValueAtTime(freq - 30, this.ctx.currentTime + 0.3);
                    note.osc.start();
                    note.osc.stop(this.ctx.currentTime + 0.3);
                }
            }, index * 150);
        });
    }
}

const sound = new SoundSynth();
document.addEventListener('click', () => sound.init(), { once: true });


// ==========================================================================
// 2. Global Game Data and Worksheet Information
// ==========================================================================
const gamesData = {
    1: {
        title: "계단을 쌓아라",
        student: "서구까",
        concept: "도형 밀기와 쌓기",
        instructions: "블록이 좌우로 움직일 때 '◀ 왼쪽으로 밀기'와 '오른쪽으로 밀기 ▶' 키를 사용해 계단의 비어있는 다음 칸 위치(모눈 기둥선)로 정확히 밀어서 정렬한 뒤 떨어뜨리세요! 5개 블록을 성공적으로 밀어 쌓으면 서구까 캐릭터가 계단을 밟고 위로 평행이동합니다.",
        sheets: [
            "source_images/계단을 쌓아라_page_1.png",
            "source_images/계단을 쌓아라_page_2.png",
            "source_images/계단을 쌓아라_page_3.png",
            "source_images/계단을 쌓아라_page_4.png"
        ],
        rulesDescription: "서구까 학생의 아기자기한 기획안입니다. 블록을 타이밍으로 그냥 떨어뜨리는 대신, 격자 기둥 위치에 딱 맞도록 '가로 밀기 좌표 조절'을 결합했습니다. 사각형, 정육각형, 리본, 세포, 하트 블록을 알맞은 X축 거리만큼 평행이동하여 오차 없이 계단을 만들어 내는 능력을 키울 수 있습니다!"
    },
    2: {
        title: "글씨 밀기 게임",
        student: "김치찌개",
        concept: "자모음 평행이동",
        instructions: "자모음 타일들을 미끄러운 격자판 위에서 상하좌우 방향으로 밀어서(평행이동) 정답 글자 칸에 넣어 단어를 완성하세요! 벽이나 다른 타일에 부딪힐 때까지 끝까지 미끄러지는 방식이므로, 전략적인 평행이동 경로 설계가 필요합니다.",
        sheets: [
            "source_images/글씨 밀기 게임_page_1.png",
            "source_images/글씨 밀기 게임_page_2.png",
            "source_images/글씨 밀기 게임_page_3.png",
            "source_images/글씨 밀기 게임_page_4.png"
        ],
        rulesDescription: "김치찌개 학생은 흩어진 자모음을 밀어서 단어를 조합하는 참신한 아이디어를 제안했습니다. 이를 모눈 격자 위에서 끝까지 미끄러져 밀려가는 '슬라이딩 소코반 퍼즐' 메커니즘으로 업그레이드했습니다. 글자들을 부딪혀가며 올바른 초성, 중성, 종성 칸에 밀어 배달하는 고도의 격자 공간 퍼즐입니다!"
    },
    3: {
        title: "도형을 밀어라",
        student: "고송까",
        concept: "방향과 칸수 계산",
        instructions: "주어지는 밀기 명령(예: 오른쪽으로 3칸, 아래로 4칸)에 맞게 그리드 위에서 도형을 정확하게 평행이동시키세요. 단, 이번 리뉴얼에서는 격자판에 단단한 장애물 벽들이 추가되어 도형 전체의 면적이 장애물에 절대 부딪히지 않도록 안전하게 밀어 목표(Goal) 지점까지 평행이동시켜야 합니다!",
        sheets: [
            "source_images/도형을 밀어라_page_1.png",
            "source_images/도형을 밀어라_page_2.png",
            "source_images/도형을 밀어라_page_3.png",
            "source_images/도형을 밀어라_page_4.png"
        ],
        rulesDescription: "고송까 학생이 설계한 교과서 밀기 유형입니다. 격자판 위에 벽 장애물을 설계해 넣음으로써, '도형을 밀었을 때 크기와 모양은 변하지 않지만 차지하는 면적이 벽에 간섭받지 않아야 한다'는 평행이동 영역 연산을 시각적이고 직관적으로 즐길 수 있도록 한 단계 발전시켰습니다!"
    },
    4: {
        title: "물 컵 밀기 게임",
        student: "도도새, 백설기, 복숭아7호",
        concept: "4방향 대각선 밀기",
        instructions: "중앙 컵에 나타난 과일 그림을 확인한 뒤, 상하좌우 평행이동 방향을 결정하여 컵을 미세요! 빙판 위처럼 컵이 장애물에 닿을 때까지 미끄러져 밀려가므로, 여러 번 밀어서 장애물에 튕겨가며 네 모서리의 알맞은 과일 주스 추출기로 컵을 배달해야 합니다.",
        sheets: [
            "source_images/물 컵 밀기 게임_page_1.png",
            "source_images/물 컵 밀기 게임_page_2.png",
            "source_images/물 컵 밀기 게임_page_3.png",
            "source_images/물 컵 밀기 게임_page_4.png"
        ],
        rulesDescription: "세 명의 학생이 공동 기획한 물컵 밀기 액션 게임입니다. 컵이 미끄러져 장애물에 부딪힐 때까지 끝까지 밀려가는 '빙판 슬라이딩 퍼즐(Ice-Sliding Vector)'로 전면 개편했습니다. 컵을 사방으로 조작해 장애물 튕기기를 활용하며 네 모서리 추출기까지 도달시키는 멋진 평행이동 콤보를 설계해 보세요!"
    },
    5: {
        title: "사람을 미세요",
        student: "과일주스",
        concept: "자세와 X축 일치",
        instructions: "위쪽 움직이는 벽에 뚫린 실루엣 구멍에 딱 맞는 자세를 고르세요! 그 다음 바닥의 X축 그리드 좌표선(-4 ~ +4)을 보고, 사람 캐릭터를 정확히 알맞은 X축 좌표 위치만큼 평행이동(밀기)시켜 벽을 안전하게 무사히 통과시키세요!",
        sheets: [
            "source_images/사람을 미세요_page_1.png",
            "source_images/사람을 미세요_page_2.png",
            "source_images/사람을 미세요_page_3.png",
            "source_images/사람을 미세요_page_4.png"
        ],
        rulesDescription: "과일주스 학생의 리드미컬하고 재치 넘치는 장벽 매치 기획안입니다. 바닥에 수치화된 가로 그리드 축과 실시간 밀기 방향/칸수 피드백 보드를 결합하여, 캐릭터의 평행이동 수치 변환(예: 왼쪽으로 3칸 밀기 = X좌표 -3 변환)을 매우 명시적이고 학습에 유용하도록 수정했습니다."
    },
    6: {
        title: "인형가게",
        student: "진라면",
        concept: "파츠 밀기와 바느질",
        instructions: "인형의 찢어진 부위들을 조립하기 위해 파츠를 클릭하고 가로/세로 '평행이동 격자 컨트롤러'를 이용해 정확한 X, Y 칸수만큼 밀어서 붙이세요! 조립을 완료한 뒤 나타나는 바느질 선 역시 대각선 이동 벡터를 골라 바늘을 정확히 밀어 꿰맨 후 로봇의 점수를 받으세요.",
        sheets: [
            "source_images/인형가게_page_1.png",
            "source_images/인형가게_page_2.png",
            "source_images/인형가게_page_3.png",
            "source_images/인형가게_page_4.png"
        ],
        rulesDescription: "진라면 학생의 사랑스러운 인형 병원 기획입니다. 자유 마우스 드래그 대신 '격자 평행이동 벡터(dx, dy) 지시 제어' 방식으로 파츠를 밀어 조립하게 하였고, 바느질 역시 대각선 밀기 방향 기하학 연산을 접목하여 수학 교육과 귀여운 의사 선생님 역할극을 완벽히 하나로 융합시켰습니다!"
    }
};


// ==========================================================================
// 3. UI Navigation & Main Application Controller
// ==========================================================================
class AppController {
    constructor() {
        this.activeGameId = null;
        
        // DOM Elements
        this.dashboardView = document.getElementById('dashboard-view');
        this.playgroundView = document.getElementById('playground-view');
        this.backBtn = document.getElementById('back-to-dashboard-btn');
        this.brandLogo = document.getElementById('brand-logo');
        this.soundBtn = document.getElementById('sound-toggle-btn');
        this.viewSheetBtn = document.getElementById('view-original-sheet-btn');
        
        // Worksheet Modal
        this.modal = document.getElementById('worksheet-modal');
        this.closeModalBtn = document.getElementById('close-modal-btn');
        this.modalGameTitle = document.getElementById('modal-game-title');
        this.modalThumbnails = document.getElementById('modal-thumbnails');
        this.modalMainImage = document.getElementById('modal-main-image');
        this.modalRulesDescription = document.getElementById('modal-rules-description');
        
        // Active Game Header
        this.activeTitle = document.getElementById('active-game-title');
        this.activeStudent = document.getElementById('active-game-student');
        this.activeConcept = document.getElementById('active-game-concept');
        this.activeInstructions = document.getElementById('control-game-instructions');
        
        this.setupNavigation();
        this.setupModal();
        this.setupAISystem();
    }

    setupNavigation() {
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = parseInt(card.getAttribute('data-game'));
                this.loadGame(gameId);
                sound.playSelect();
            });
        });

        this.backBtn.addEventListener('click', () => {
            this.showDashboard();
            sound.playSelect();
        });

        this.brandLogo.addEventListener('click', () => {
            this.showDashboard();
            sound.playSelect();
        });

        this.soundBtn.addEventListener('click', () => {
            const isMuted = sound.toggleMute();
            this.soundBtn.textContent = isMuted ? '🔇' : '🔊';
            if (!isMuted) {
                sound.playSelect();
            }
        });
    }

    setupModal() {
        this.viewSheetBtn.addEventListener('click', () => {
            this.openWorksheetModal();
            sound.playSelect();
        });

        this.closeModalBtn.addEventListener('click', () => {
            this.closeWorksheetModal();
            sound.playSelect();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeWorksheetModal();
            }
        });
    }

    async loadEnvConfig() {
        try {
            const response = await fetch('.env');
            if (response.ok) {
                const text = await response.text();
                const lines = text.split('\n');
                for (let line of lines) {
                    line = line.trim();
                    if (line.startsWith('#') || !line) continue;
                    
                    const eqIndex = line.indexOf('=');
                    if (eqIndex !== -1) {
                        const key = line.substring(0, eqIndex).trim();
                        const value = line.substring(eqIndex + 1).replace(/['"]/g, '').trim();
                        
                        if (key === 'OPENAI_API_KEY' && value) {
                            localStorage.setItem('openai_api_key', value);
                            if (this.openaiApiKeyInput) {
                                this.openaiApiKeyInput.value = value;
                            }
                            console.log('Successfully loaded and synchronized OpenAI API key from local .env file! 🧙‍♂️🔒');
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            console.debug('No local .env file resolved, relying strictly on localStorage.');
        }
    }

    setupAISystem() {
        // AI Settings Modal Elements
        this.aiSettingsBtn = document.getElementById('ai-settings-btn');
        this.aiSettingsModal = document.getElementById('ai-settings-modal');
        this.closeAiSettingsBtn = document.getElementById('close-ai-settings-btn');
        this.saveAiSettingsBtn = document.getElementById('save-ai-settings-btn');
        this.openaiApiKeyInput = document.getElementById('openai-api-key-input');

        // AI Chatbot Elements
        this.aiChatToggleBtn = document.getElementById('ai-chat-toggle-btn');
        this.aiChatContainer = document.getElementById('ai-chat-container');
        this.aiChatCloseBtn = document.getElementById('ai-chat-close-btn');
        this.aiChatInput = document.getElementById('ai-chat-input');
        this.aiChatSendBtn = document.getElementById('ai-chat-send-btn');
        this.aiChatMessages = document.getElementById('ai-chat-messages');

        // Pre-fill key on mount
        const savedKey = localStorage.getItem('openai_api_key');
        if (savedKey) {
            this.openaiApiKeyInput.value = savedKey;
        }

        // Try loading from local .env asynchronously to streamline local development
        this.loadEnvConfig();

        // Bind settings events
        if (this.aiSettingsBtn) {
            this.aiSettingsBtn.addEventListener('click', () => {
                this.aiSettingsModal.classList.add('active');
                sound.playSelect();
            });
        }
        if (this.closeAiSettingsBtn) {
            this.closeAiSettingsBtn.addEventListener('click', () => {
                this.aiSettingsModal.classList.remove('active');
                sound.playSelect();
            });
        }
        if (this.aiSettingsModal) {
            this.aiSettingsModal.addEventListener('click', (e) => {
                if (e.target === this.aiSettingsModal) {
                    this.aiSettingsModal.classList.remove('active');
                }
            });
        }
        if (this.saveAiSettingsBtn) {
            this.saveAiSettingsBtn.addEventListener('click', () => {
                const key = this.openaiApiKeyInput.value.trim();
                localStorage.setItem('openai_api_key', key);
                this.aiSettingsModal.classList.remove('active');
                sound.playSuccess();
                alert('AI 마법 튜터 설정이 안전하게 브라우저 저장소에 저장되었습니다! 🧙‍♂️✨');
            });
        }

        // Bind chat events
        if (this.aiChatToggleBtn) {
            this.aiChatToggleBtn.addEventListener('click', () => {
                const isHidden = this.aiChatContainer.classList.toggle('hidden');
                sound.playSelect();
                if (!isHidden) {
                    this.aiChatInput.focus();
                    this.scrollToBottom();
                }
            });
        }
        if (this.aiChatCloseBtn) {
            this.aiChatCloseBtn.addEventListener('click', () => {
                this.aiChatContainer.classList.add('hidden');
                sound.playSelect();
            });
        }
        if (this.aiChatSendBtn) {
            this.aiChatSendBtn.addEventListener('click', () => this.handleUserChatMessage());
        }
        if (this.aiChatInput) {
            this.aiChatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleUserChatMessage();
                }
            });
        }
    }

    scrollToBottom() {
        if (this.aiChatMessages) {
            this.aiChatMessages.scrollTop = this.aiChatMessages.scrollHeight;
        }
    }

    async handleUserChatMessage() {
        const text = this.aiChatInput.value.trim();
        if (!text) return;

        this.aiChatInput.value = '';
        sound.playSelect();

        // 1. Render User Message
        this.appendMessage('user', text);
        this.scrollToBottom();

        // 2. Render Typing Indicator
        const indicator = this.showTypingIndicator();
        this.scrollToBottom();

        // 3. Check for API key
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            indicator.remove();
            this.appendMessage('bot', '안녕! 🧙‍♂️ 오즈의 실시간 AI 마법 답변을 경험하려면 상단의 **[⚙️ AI 설정]** 버튼을 클릭해서 OpenAI API 키를 먼저 등록해 줘! 키를 입력하면 내가 항상 1초 만에 재미있게 힌트를 줄 수 있어! 📐✨');
            this.scrollToBottom();
            return;
        }

        // 4. Call OpenAI API
        try {
            const systemPrompt = "당신은 초등학교 4학년 학생들이 도형의 밀기(평행이동) 개념을 배울 때 친절하게 안내하고 힌트를 주는 다정한 마법사 수학 튜터 '오즈(OZ)'입니다. 4학년 수준에 맞게 격려가 넘치고 쉬운 수학 설명과 이모지(📐, 🔮, ✨, 🧙‍♂️)를 가득 사용해서 3문장 이내로 다정하게 답해 주세요. 한국어로 작성하며, 아주 사랑스럽고 격려하는 반말(~했어?, ~해보자!)로 친근하게 학생을 맞이해 주세요. 수학 및 도형 평행이동에 관련 없는 질문이라도 재미있게 도형 밀기 얘기로 유도해 주세요.";
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: text }
                    ],
                    max_tokens: 250,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const reply = data.choices[0].message.content.trim();
            
            indicator.remove();
            this.appendMessage('bot', reply);
            sound.playSuccess();
        } catch (error) {
            console.error('OpenAI API Error:', error);
            indicator.remove();
            this.appendMessage('bot', `이런! 마법 통신에 장애가 생겼어. 😭 API 키가 올바른지, 혹은 만료되었는지 **[⚙️ AI 설정]**에서 확인해 줄래? 에러 내용: ${error.message}`);
        }
        this.scrollToBottom();
    }

    appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        
        const avatar = sender === 'bot' ? '<div class="message-avatar">🧙‍♂️</div>' : '';
        const markdownFormatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');

        msgDiv.innerHTML = `
            ${avatar}
            <div class="message-content">${markdownFormatted}</div>
        `;
        this.aiChatMessages.appendChild(msgDiv);
    }

    showTypingIndicator() {
        const indDiv = document.createElement('div');
        indDiv.className = 'chat-message bot typing';
        indDiv.id = 'ai-typing-indicator';
        indDiv.innerHTML = `
            <div class="message-avatar">🧙‍♂️</div>
            <div class="message-content">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        `;
        this.aiChatMessages.appendChild(indDiv);
        return indDiv;
    }

    loadGame(gameId) {
        this.activeGameId = gameId;
        const data = gamesData[gameId];
        
        this.activeTitle.textContent = data.title;
        this.activeStudent.textContent = data.student;
        this.activeConcept.textContent = data.concept;
        this.activeInstructions.textContent = data.instructions;
        
        this.dashboardView.classList.add('hidden');
        this.playgroundView.classList.remove('hidden');
        this.backBtn.classList.remove('hidden');

        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        document.getElementById('game-overlay-screen').classList.remove('active');
        document.getElementById(`game-${gameId}-screen`).classList.remove('hidden');
        this.playgroundView.scrollIntoView({ behavior: 'smooth' });

        this.initGameController(gameId);
    }

    showDashboard() {
        this.activeGameId = null;
        this.dashboardView.classList.remove('hidden');
        this.playgroundView.classList.add('hidden');
        this.backBtn.classList.add('hidden');
        
        if (this.gameInstance && typeof this.gameInstance.cleanup === 'function') {
            this.gameInstance.cleanup();
        }
    }

    openWorksheetModal() {
        if (!this.activeGameId) return;
        const data = gamesData[this.activeGameId];
        
        this.modalGameTitle.textContent = `${data.title} - 원래 기획서 (기획: ${data.student})`;
        this.modalRulesDescription.textContent = data.rulesDescription;
        
        this.modalThumbnails.innerHTML = '';
        
        data.sheets.forEach((path, i) => {
            const wrapper = document.createElement('div');
            wrapper.className = `sheet-image-wrapper ${i === 0 ? 'active' : ''}`;
            
            const img = document.createElement('img');
            img.src = path;
            img.alt = `Page ${i + 1}`;
            
            wrapper.appendChild(img);
            wrapper.addEventListener('click', () => {
                document.querySelectorAll('.sheet-image-wrapper').forEach(w => w.classList.remove('active'));
                wrapper.classList.add('active');
                this.modalMainImage.src = path;
                sound.playSelect();
            });
            
            this.modalThumbnails.appendChild(wrapper);
        });

        this.modalMainImage.src = data.sheets[0];
        this.modal.classList.add('active');
    }

    closeWorksheetModal() {
        this.modal.classList.remove('active');
    }

    initGameController(gameId) {
        if (this.gameInstance && typeof this.gameInstance.cleanup === 'function') {
            this.gameInstance.cleanup();
        }

        switch(gameId) {
            case 1: this.gameInstance = new GameStairs(); break;
            case 2: this.gameInstance = new GameLetters(); break;
            case 3: this.gameInstance = new GamePushGrid(); break;
            case 4: this.gameInstance = new GameWaterCup(); break;
            case 5: this.gameInstance = new GamePushPerson(); break;
            case 6: this.gameInstance = new GameDollShop(); break;
        }
        
        this.gameInstance.start();
    }
}


// ==========================================================================
// 4. GAME 1: 계단을 쌓아라 (Build the Stairs - Grid Stacker Refactor)
// ==========================================================================
class GameStairs {
    constructor() {
        this.canvas = document.getElementById('stairs-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.statusVal1 = document.getElementById('status-val-1');
        this.statusVal2 = document.getElementById('status-val-2');
        this.statusLabel1 = document.getElementById('status-label-1');
        this.statusLabel2 = document.getElementById('status-label-2');
        this.controlsContainer = document.getElementById('interactive-controls-container');
        
        this.level = 1;
        this.maxLevel = 5;
        this.blockShapes = { 1: 'square', 2: 'hexagon', 3: 'ribbon', 4: 'cell', 5: 'heart' };
        this.shapeNames = { 1: '네모 모양 블록', 2: '정육각형 블록', 3: '리본 모양 블록', 4: '세포 모양 블록', 5: '사랑 가득 하트 블록' };

        this.stairsPlaced = [];
        this.currentBlock = null;
        this.character = { x: 30, y: 440, targetX: 30, targetY: 440, state: 'idle' };
        
        this.stairHeight = 50;
        this.stairWidth = 70;
        this.startX = 60;
        this.startY = 440;
        
        this.isDropping = false;
        this.reqAnim = null;
        
        // Grid properties
        this.currentGridCol = 0; // range 0 to 6
        this.maxCols = 7;
    }

    start() {
        this.level = 1;
        this.stairsPlaced = [];
        this.character = { x: 30, y: 440, targetX: 30, targetY: 440, state: 'idle' };

        this.statusLabel1.textContent = "계단 높이";
        this.statusLabel2.textContent = "블록 유형";
        
        this.initLevel();
        
        const loop = () => {
            this.update();
            this.draw();
            this.reqAnim = requestAnimationFrame(loop);
        };
        this.reqAnim = requestAnimationFrame(loop);
    }

    initLevel() {
        this.stairsPlaced = [];
        this.isDropping = false;
        this.character.x = 30;
        this.character.y = 440;
        this.character.targetX = 30;
        this.character.targetY = 440;
        this.character.state = 'idle';
        
        this.statusVal1.textContent = `${this.stairsPlaced.length} / 5 단`;
        this.statusVal2.textContent = this.shapeNames[this.level];
        
        this.spawnBlock();
        this.setupControls();
    }

    spawnBlock() {
        const stepNum = this.stairsPlaced.length;
        const targetY = this.startY - stepNum * this.stairHeight;
        
        // Start at middle column (col 3)
        this.currentGridCol = 3;
        
        this.currentBlock = {
            col: this.currentGridCol,
            x: this.startX + this.currentGridCol * this.stairWidth,
            y: 50,
            targetCol: stepNum, // The correct column for the staircase step!
            targetY: targetY - this.stairHeight,
            sizeW: this.stairWidth,
            sizeH: this.stairHeight,
            state: 'sliding', // controlled sliding state
            dropSpeed: 12
        };
        this.isDropping = false;
    }

    setupControls() {
        this.controlsContainer.innerHTML = `
            <div style="text-align:center; margin-bottom:12px;">
                <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;">📐 다음 계단이 될 <strong style="color:var(--success);">초록색 실선 위치</strong>로 블록을 밀어 정렬하세요!</p>
                <div style="display:flex; justify-content:center; gap:10px;">
                    <button class="action-btn" id="stair-move-left" style="flex:1;">◀ 왼쪽으로 밀기</button>
                    <button class="action-btn" id="stair-move-right" style="flex:1;">오른쪽으로 밀기 ▶</button>
                </div>
            </div>
            <button class="word-check-btn" id="stair-drop-btn" style="background: linear-gradient(135deg, var(--success), #059669);">
                📥 정렬 후 블록 떨어뜨리기 (Space)
            </button>
        `;
        
        document.getElementById('stair-move-left').onclick = () => this.shiftBlock(-1);
        document.getElementById('stair-move-right').onclick = () => this.shiftBlock(1);
        document.getElementById('stair-drop-btn').onclick = () => this.dropBlock();

        this.keyHandler = (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.shiftBlock(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.shiftBlock(1); }
            if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); this.dropBlock(); }
        };
        window.addEventListener('keydown', this.keyHandler);
    }

    shiftBlock(dir) {
        if (!this.currentBlock || this.isDropping) return;
        const nextCol = this.currentGridCol + dir;
        if (nextCol >= 0 && nextCol < this.maxCols) {
            this.currentGridCol = nextCol;
            this.currentBlock.col = nextCol;
            this.currentBlock.x = this.startX + nextCol * this.stairWidth;
            sound.playMove();
        }
    }

    dropBlock() {
        if (!this.currentBlock || this.isDropping) return;
        this.isDropping = true;
        this.currentBlock.state = 'dropping';
        sound.playMove();
    }

    update() {
        // Character move animation
        const dx = this.character.targetX - this.character.x;
        const dy = this.character.targetY - this.character.y;
        if (Math.abs(dx) > 1) this.character.x += dx * 0.1;
        else this.character.x = this.character.targetX;
        
        if (Math.abs(dy) > 1) this.character.y += dy * 0.1;
        else this.character.y = this.character.targetY;

        if (this.character.x === this.character.targetX && this.character.y === this.character.targetY) {
            this.character.state = 'idle';
        }

        if (!this.currentBlock) return;

        if (this.currentBlock.state === 'dropping') {
            this.currentBlock.y += this.currentBlock.dropSpeed;
            if (this.currentBlock.y >= this.currentBlock.targetY) {
                this.currentBlock.y = this.currentBlock.targetY;
                this.evaluateLanding();
            }
        }
    }

    evaluateLanding() {
        const block = this.currentBlock;
        const stepNum = this.stairsPlaced.length;
        
        if (block.col === block.targetCol) {
            // EXACT Snap! Mathematically correct grid translation
            this.stairsPlaced.push({
                x: block.x,
                y: block.y,
                type: this.blockShapes[this.level]
            });
            this.currentBlock = null;
            sound.playSuccess();

            // Status update
            this.statusVal1.textContent = `${this.stairsPlaced.length} / 5 단`;

            // Character climbs up (X, Y translation)
            this.character.targetX = block.x + this.stairWidth / 2 - 10;
            this.character.targetY = block.y - 42;
            this.character.state = 'climbing';

            if (this.stairsPlaced.length >= 5) {
                setTimeout(() => this.completeLevel(), 800);
            } else {
                setTimeout(() => this.spawnBlock(), 500);
            }
        } else {
            // Failure! Crash and lose.
            sound.playFailure();
            const shiftVector = block.targetCol - block.col;
            const shiftDirection = shiftVector > 0 ? "오른쪽으로" : "왼쪽으로";
            const shiftText = `${shiftDirection} ${Math.abs(shiftVector)}칸 더 밀어야`;
            
            this.showOverlay(false, `계단 정렬 실패! 정답 칸보다 ${Math.abs(shiftVector)}칸 ${shiftVector > 0 ? '왼쪽' : '오른쪽'}에 떨어졌습니다. [${shiftText}] 했어야 합니다!`, () => {
                this.initLevel();
            });
        }
    }

    completeLevel() {
        sound.playWin();
        if (this.level < this.maxLevel) {
            this.showOverlay(true, `${this.level}단계 계단을 평행이동 밀기로 아름답게 정렬 완성했습니다! 다음 모양 계단으로 나아갑니다!`, () => {
                this.level++;
                this.initLevel();
            });
        } else {
            this.showOverlay(true, "대단해요! 서구까 학생이 기획한 모든 모양(네모, 육각, 리본, 세포, 하트)의 계단을 정확한 칸수로 밀어 멋지게 정복했습니다! 🏆", () => {
                app.showDashboard();
            }, "메인으로");
        }
    }

    showOverlay(win, message, action, buttonText = "계속하기") {
        const overlay = document.getElementById('game-overlay-screen');
        const title = document.getElementById('overlay-title');
        const desc = document.getElementById('overlay-desc');
        const btn = document.getElementById('overlay-action-btn');

        title.textContent = win ? "참 잘했어요! ✨" : "와르르르... 😭";
        title.className = `overlay-title ${win ? 'win' : 'lose'}`;
        desc.textContent = message;
        btn.textContent = buttonText;
        
        btn.onclick = () => {
            overlay.classList.remove('active');
            action();
        };

        overlay.classList.add('active');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines to emphasize "도형의 밀기"
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let c = 0; c <= this.maxCols; c++) {
            const gx = this.startX + c * this.stairWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(gx, 0);
            this.ctx.lineTo(gx, 440);
            this.ctx.stroke();
        }
        for (let y = 50; y < 440; y += this.stairHeight) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, y);
            this.ctx.lineTo(this.startX + this.maxCols * this.stairWidth, y);
            this.ctx.stroke();
        }

        // Draw ground floor
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, 440, this.canvas.width, 60);
        this.ctx.fillStyle = '#6366f1';
        this.ctx.fillRect(0, 440, this.canvas.width, 4);

        // Draw Target Snap outline where block MUST be translated to
        if (this.currentBlock) {
            const stepNum = this.stairsPlaced.length;
            const targetX = this.startX + stepNum * this.stairWidth;
            const targetY = this.startY - (stepNum + 1) * this.stairHeight;
            
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([4, 4]);
            this.ctx.strokeRect(targetX + 2, targetY + 2, this.stairWidth - 4, this.stairHeight - 4);
            
            // Draw math arrow visual
            if (this.currentBlock.state === 'sliding') {
                this.ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
                this.ctx.fillRect(targetX + 2, targetY + 2, this.stairWidth - 4, this.stairHeight - 4);
            }
            this.ctx.restore();
        }

        // Draw already placed blocks
        this.stairsPlaced.forEach((stair, i) => {
            this.drawShape(stair.type, stair.x, stair.y, this.stairWidth, this.stairHeight, true);
        });

        // Draw active block
        if (this.currentBlock) {
            this.drawShape(
                this.blockShapes[this.level],
                this.currentBlock.x,
                this.currentBlock.y,
                this.currentBlock.sizeW,
                this.currentBlock.sizeH,
                false
            );
        }

        this.drawCharacter();
    }

    drawShape(type, x, y, w, h, placed) {
        this.ctx.save();
        
        let grad = this.ctx.createLinearGradient(x, y, x, y + h);
        if (placed) {
            grad.addColorStop(0, '#10b981');
            grad.addColorStop(1, '#059669');
            this.ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
        } else {
            grad.addColorStop(0, '#ec4899');
            grad.addColorStop(1, '#db2777');
            this.ctx.shadowColor = 'rgba(236, 72, 153, 0.4)';
        }
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = grad;
        this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        this.ctx.lineWidth = 2;

        switch(type) {
            case 'square':
                this.ctx.beginPath();
                this.ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 8);
                this.ctx.fill();
                this.ctx.stroke();
                break;
            case 'hexagon':
                this.ctx.beginPath();
                const center = { x: x + w/2, y: y + h/2 };
                const radius = Math.min(w, h) / 2 - 3;
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const hx = center.x + radius * Math.cos(angle);
                    const hy = center.y + radius * Math.sin(angle);
                    if (i === 0) this.ctx.moveTo(hx, hy);
                    else this.ctx.lineTo(hx, hy);
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;
            case 'ribbon':
                this.ctx.beginPath();
                this.ctx.moveTo(x + 6, y + 6);
                this.ctx.lineTo(x + w - 6, y + h - 6);
                this.ctx.lineTo(x + w - 6, y + 6);
                this.ctx.lineTo(x + 6, y + h - 6);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, 5, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'cell':
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, Math.min(w, h)/2 - 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
                this.ctx.beginPath();
                this.ctx.arc(x + w/2 - 5, y + h/2 - 3, 3, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'heart':
                this.ctx.beginPath();
                const topY = y + h * 0.35;
                w -= 4; h -= 4; x += 2; y += 2;
                this.ctx.moveTo(x + w/2, y + h - 4);
                this.ctx.bezierCurveTo(x + 2, y + h * 0.6, x - 2, y + 2, x + w/2, topY);
                this.ctx.bezierCurveTo(x + w + 2, y + 2, x + w - 2, y + h * 0.6, x + w/2, y + h - 4);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;
        }
        this.ctx.restore();
    }

    drawCharacter() {
        const char = this.character;
        this.ctx.save();
        
        // Character drawing details (서구까)
        this.ctx.fillStyle = '#fed7aa';
        this.ctx.beginPath();
        this.ctx.arc(char.x + 10, char.y + 10, 10, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#451a03';
        this.ctx.beginPath();
        this.ctx.arc(char.x + 10, char.y + 7, 11, Math.PI, 0);
        this.ctx.fill();
        this.ctx.fillRect(char.x - 1, char.y + 7, 4, 8);
        this.ctx.fillRect(char.x + 17, char.y + 7, 4, 8);
        
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(char.x + 10, char.y + 9, 10, Math.PI + 0.3, -0.3);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(char.x + 3, char.y, 3, 0, Math.PI*2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(char.x + 5, char.y + 8, 2, 3);
        this.ctx.fillRect(char.x + 13, char.y + 8, 2, 3);
        
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(char.x + 10, char.y + 12, 3, 0, Math.PI);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ec4899';
        this.ctx.beginPath();
        this.ctx.moveTo(char.x + 10, char.y + 20);
        this.ctx.lineTo(char.x, char.y + 36);
        this.ctx.lineTo(char.x + 20, char.y + 36);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = '#fed7aa';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(char.x + 6, char.y + 36);
        this.ctx.lineTo(char.x + 6, char.y + 42);
        this.ctx.moveTo(char.x + 14, char.y + 36);
        this.ctx.lineTo(char.x + 14, char.y + 42);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(char.x + 4, char.y + 41, 4, 3);
        this.ctx.fillRect(char.x + 12, char.y + 41, 4, 3);

        this.ctx.restore();
    }

    cleanup() {
        if (this.reqAnim) cancelAnimationFrame(this.reqAnim);
        window.removeEventListener('keydown', this.keyHandler);
    }
}


// ==========================================================================
// 5. GAME 2: 글씨 밀기 게임 (Word Pushing Game - Letter Sokoban Refactor)
// ==========================================================================
class GameLetters {
    constructor() {
        this.workspace = document.getElementById('letters-workspace');
        this.targetsWrapper = document.getElementById('letter-targets-wrapper');
        
        this.statusVal1 = document.getElementById('status-val-1');
        this.statusVal2 = document.getElementById('status-val-2');
        this.statusLabel1 = document.getElementById('status-label-1');
        this.statusLabel2 = document.getElementById('status-label-2');
        this.controlsContainer = document.getElementById('interactive-controls-container');
        
        this.level = 1;
        this.maxLevel = 2;
        this.wordSet = {
            1: { word: "필통", chars: ["ㅍ", "ㅣ", "ㄹ", "ㅌ", "ㅗ", "ㅇ"] },
            2: { word: "학원", chars: ["ㅎ", "ㅏ", "ㄱ", "ㅇ", "ㅝ", "ㄴ"] }
        };
        
        // Grid Sokoban Properties
        this.gridSize = 6; // 6x6 puzzle grid
        this.boardState = []; // 2D array representation
        this.lettersPositions = []; // active coordinate of each letter
        this.selectedTileIndex = null;
        
        // Obstacles config (e.g. fixed boxes inside grid)
        this.obstacles = [
            { r: 1, c: 1 }, { r: 1, c: 4 },
            { r: 4, c: 1 }, { r: 4, c: 4 }
        ];
    }

    start() {
        this.level = 1;
        this.statusLabel1.textContent = "단계";
        this.statusLabel2.textContent = "완성 단어";
        
        this.initLevel();
    }

    initLevel() {
        this.statusVal1.textContent = `${this.level} / ${this.maxLevel}`;
        const activeWord = this.wordSet[this.level].word;
        this.statusVal2.textContent = `"${activeWord}"`;
        
        this.workspace.innerHTML = '';
        this.targetsWrapper.innerHTML = '';
        this.selectedTileIndex = null;
        
        // Renders target boxes at bottom of screen
        const currentData = this.wordSet[this.level];
        currentData.chars.forEach((char, index) => {
            const target = document.createElement('div');
            target.className = 'letter-target';
            target.setAttribute('data-target-char', char);
            target.setAttribute('data-index', index);
            target.textContent = char;
            this.targetsWrapper.appendChild(target);
        });

        // Initialize 6x6 Sokoban Grid Visuals inside workspace
        this.workspace.style.display = 'grid';
        this.workspace.style.gridTemplateColumns = 'repeat(6, 1fr)';
        this.workspace.style.gridTemplateRows = 'repeat(6, 1fr)';
        this.workspace.style.gap = '2px';
        this.workspace.style.padding = '10px';
        
        // Renders 36 cells
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'letters-grid-cell';
                cell.setAttribute('data-r', r);
                cell.setAttribute('data-c', c);
                
                // Style cells beautifully
                cell.setAttribute('style', `
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `);
                
                // Add obstacle visual
                if (this.isObstacle(r, c)) {
                    cell.style.background = 'rgba(236, 72, 153, 0.1)';
                    cell.style.border = '1px solid rgba(236, 72, 153, 0.2)';
                    cell.textContent = '🧱';
                    cell.style.fontSize = '1.2rem';
                }
                
                this.workspace.appendChild(cell);
            }
        }

        // Place Letter Tiles inside the grid cells
        this.lettersPositions = [];
        const possibleCoords = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                // Don't place on obstacles or edges to leave space
                if (!this.isObstacle(r, c) && !(r === 0 && c === 0)) {
                    possibleCoords.push({ r, c });
                }
            }
        }
        
        // Shuffle coords
        possibleCoords.sort(() => Math.random() - 0.5);
        
        currentData.chars.forEach((char, index) => {
            const coord = possibleCoords[index];
            this.lettersPositions.push({
                char: char,
                r: coord.r,
                c: coord.c,
                id: index
            });
        });

        this.drawLetterTiles();
        this.setupControls();
    }

    isObstacle(r, c) {
        return this.obstacles.some(o => o.r === r && o.c === c);
    }

    isTileOccupied(r, c) {
        return this.lettersPositions.some(p => p.r === r && p.c === c);
    }

    drawLetterTiles() {
        // Remove existing tile DOMs
        document.querySelectorAll('.letter-tile-element').forEach(t => t.remove());

        // Render tiles
        this.lettersPositions.forEach((tile, index) => {
            // Find target cell DOM
            const cell = this.workspace.querySelector(`[data-r="${tile.r}"][data-c="${tile.c}"]`);
            if (cell) {
                const el = document.createElement('div');
                el.className = 'letter-tile-element';
                el.textContent = tile.char;
                
                // Styles
                const isSelected = this.selectedTileIndex === index;
                el.setAttribute('style', `
                    width: 80%;
                    height: 80%;
                    background: ${isSelected ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)'};
                    border: 2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.3)'};
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: white;
                    cursor: pointer;
                    box-shadow: ${isSelected ? '0 0 15px var(--primary-glow)' : '0 4px 6px rgba(0,0,0,0.3)'};
                    transition: all 0.15s ease;
                `);

                el.onclick = (e) => {
                    e.stopPropagation();
                    this.selectedTileIndex = index;
                    sound.playSelect();
                    this.drawLetterTiles();
                };

                cell.appendChild(el);
            }
        });
    }

    setupControls() {
        this.controlsContainer.innerHTML = `
            <div style="text-align:center;">
                <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">📐 자모음 타일을 클릭한 뒤 아래 방향 버튼으로 **끝까지 밀어내세요**!</p>
                <div class="push-controls-panel" style="margin-bottom:12px;">
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="let-up">▲</button>
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="let-left">◀</button>
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="let-right">▶</button>
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="let-down">▼</button>
                    <button class="push-control-btn empty"></button>
                </div>
            </div>
            <button class="word-check-btn" id="word-submit-btn">
                📝 슬롯에 맞춰 밀기 완료 & 정답 검증!
            </button>
        `;

        document.getElementById('let-up').onclick = () => this.slideLetter(0, -1);
        document.getElementById('let-down').onclick = () => this.slideLetter(0, 1);
        document.getElementById('let-left').onclick = () => this.slideLetter(-1, 0);
        document.getElementById('let-right').onclick = () => this.slideLetter(1, 0);
        
        document.getElementById('word-submit-btn').onclick = () => this.evaluateLetterMatch();

        this.keyHandler = (e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); this.slideLetter(0, -1); }
            if (e.key === 'ArrowDown') { e.preventDefault(); this.slideLetter(0, 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.slideLetter(-1, 0); }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.slideLetter(1, 0); }
        };
        window.addEventListener('keydown', this.keyHandler);
    }

    slideLetter(dc, dr) {
        if (this.selectedTileIndex === null) return;
        
        const tile = this.lettersPositions[this.selectedTileIndex];
        let curR = tile.r;
        let curC = tile.c;
        let moved = false;

        // Slide continuously until hits boundary, obstacle, or another tile!
        while (true) {
            const nextR = curR + dr;
            const nextC = curC + dc;
            
            // Check boundary limits
            if (nextR < 0 || nextR >= this.gridSize || nextC < 0 || nextC >= this.gridSize) break;
            // Check fixed walls
            if (this.isObstacle(nextR, nextC)) break;
            // Check other sliding tiles
            if (this.isTileOccupied(nextR, nextC)) break;
            
            curR = nextR;
            curC = nextC;
            moved = true;
        }

        if (moved) {
            tile.r = curR;
            tile.c = curC;
            sound.playMove();
            this.drawLetterTiles();
            
            // Auto check if any tile lands on target slots (visually snaps/highlights targets)
            this.updateTargetHighlight();
        }
    }

    updateTargetHighlight() {
        const targets = document.querySelectorAll('.letter-target');
        targets.forEach(tar => {
            const char = tar.getAttribute('data-target-char');
            // Check if any tile with matching char is located in a specific grid row (e.g. bottom row row 5)
            // Let's say, we map slot index to specific grid columns (col 0 to 5) in row 5!
            const slotIndex = parseInt(tar.getAttribute('data-index'));
            const matchingTile = this.lettersPositions.find(p => p.char === char && p.r === 5 && p.c === slotIndex);
            
            if (matchingTile) {
                tar.classList.add('filled');
                tar.setAttribute('data-filled-by', char);
            } else {
                tar.classList.remove('filled');
                tar.removeAttribute('data-filled-by');
            }
        });
    }

    evaluateLetterMatch() {
        const targets = document.querySelectorAll('.letter-target');
        let allCorrect = true;
        
        targets.forEach(tar => {
            const targetChar = tar.getAttribute('data-target-char');
            const filledChar = tar.getAttribute('data-filled-by');
            
            if (filledChar !== targetChar) {
                allCorrect = false;
            }
        });

        if (allCorrect) {
            sound.playWin();
            this.showOverlay(true, `대단해요! 소코반 빙판 밀기를 통해 자모음을 완벽히 슬롯(5번 행 격자)에 맞췄습니다! "${this.wordSet[this.level].word}" 복원 완료! 🏆`, () => {
                if (this.level < this.maxLevel) {
                    this.level++;
                    this.initLevel();
                } else {
                    this.showOverlay(true, "대단합니다! 김치찌개 학생이 기획한 한글 글자 격자 밀기 소코반 퍼즐을 모두 완벽하게 해결했습니다! 🏆🎉", () => {
                        app.showDashboard();
                    }, "메인으로");
                }
            });
        } else {
            sound.playFailure();
            this.showOverlay(false, "글자가 맞지 않는 칸이 있거나 비어있습니다. 격자판 최하단 줄(5번 행)의 알맞은 칸 번호에 자모음들을 차례대로 밀어서 골인시켜 보세요!", () => {});
        }
    }

    showOverlay(win, message, action, buttonText = "계속하기") {
        const overlay = document.getElementById('game-overlay-screen');
        const title = document.getElementById('overlay-title');
        const desc = document.getElementById('overlay-desc');
        const btn = document.getElementById('overlay-action-btn');

        title.textContent = win ? "정답입니다! ✨" : "아직 미완성! ✏️";
        title.className = `overlay-title ${win ? 'win' : 'lose'}`;
        desc.textContent = message;
        btn.textContent = buttonText;
        
        btn.onclick = () => {
            overlay.classList.remove('active');
            action();
        };

        overlay.classList.add('active');
    }

    cleanup() {
        window.removeEventListener('keydown', this.keyHandler);
        this.workspace.innerHTML = '';
        this.workspace.style.display = 'block'; // reset defaults
    }
}


// ==========================================================================
// 6. GAME 3: 도형을 밀어라 (Push the Shapes - Obstacles and Lasers Refactor)
// ==========================================================================
class GamePushGrid {
    constructor() {
        this.playfield = document.getElementById('grid-playfield');
        
        this.statusVal1 = document.getElementById('status-val-1');
        this.statusVal2 = document.getElementById('status-val-2');
        this.statusLabel1 = document.getElementById('status-label-1');
        this.statusLabel2 = document.getElementById('status-label-2');
        this.controlsContainer = document.getElementById('interactive-controls-container');
        
        this.level = 1;
        this.maxLevel = 15;
        this.gridSize = 10;
        
        this.stages = [
            { id: 1, type: 'triangle', start: {x: 1, y: 1}, shift: {dx: 4, dy: 0}, cmd: "오른쪽으로 4칸 밀기", obstacles: [{x:3, y:1}] },
            { id: 2, type: 'square', start: {x: 4, y: 8}, shift: {dx: 0, dy: -3}, cmd: "위쪽으로 3칸 밀기", obstacles: [{x:4, y:6}] },
            { id: 3, type: 'triangle', start: {x: 8, y: 1}, shift: {dx: -3, dy: 4}, cmd: "왼쪽으로 3칸, 아래로 4칸 밀기", obstacles: [{x:7, y:3}, {x:5, y:2}] },
            { id: 4, type: 'cone', start: {x: 1, y: 7}, shift: {dx: 2, dy: -2}, cmd: "오른쪽으로 2칸, 위로 2칸 밀기", obstacles: [{x:2, y:6}] },
            { id: 5, type: 'cube', start: {x: 1, y: 1}, shift: {dx: 4, dy: 4}, cmd: "오른쪽으로 4칸, 아래로 4칸 밀기", obstacles: [{x:3, y:3}, {x:2, y:4}] },
            { id: 6, type: 'triangle', start: {x: 8, y: 8}, shift: {dx: -5, dy: -3}, cmd: "왼쪽으로 5칸, 위로 3칸 밀기", obstacles: [{x:5, y:6}] },
            { id: 7, type: 'parallelogram', start: {x: 1, y: 4}, shift: {dx: 4, dy: -1}, cmd: "오른쪽으로 4칸, 위로 1칸 밀기", obstacles: [{x:3, y:4}] },
            { id: 8, type: 'cube', start: {x: 6, y: 3}, shift: {dx: -3, dy: 3}, cmd: "왼쪽으로 3칸, 아래로 3칸 밀기", obstacles: [{x:4, y:4}] },
            { id: 9, type: 'triangle', start: {x: 2, y: 1}, shift: {dx: 3, dy: 5}, cmd: "오른쪽으로 3칸, 아래로 5칸 밀기", obstacles: [{x:3, y:3}, {x:4, y:2}] },
            { id: 10, type: 'cone', start: {x: 8, y: 8}, shift: {dx: -4, dy: -4}, cmd: "왼쪽으로 4칸, 위로 4칸 밀기", obstacles: [{x:6, y:6}, {x:5, y:7}] },
            { id: 11, type: 'parallelogram', start: {x: 1, y: 7}, shift: {dx: 5, dy: -4}, cmd: "오른쪽으로 5칸, 위로 4칸 밀기", obstacles: [{x:3, y:5}] },
            { id: 12, type: 'square', start: {x: 7, y: 1}, shift: {dx: -5, dy: 6}, cmd: "왼쪽으로 5칸, 아래로 6칸 밀기", obstacles: [{x:4, y:3}] },
            { id: 13, type: 'cone', start: {x: 1, y: 1}, shift: {dx: 5, dy: 3}, cmd: "오른쪽으로 5칸, 아래로 3칸 밀기", obstacles: [{x:3, y:2}] },
            { id: 14, type: 'cube', start: {x: 8, y: 2}, shift: {dx: -5, dy: 4}, cmd: "왼쪽으로 5칸, 아래로 4칸 밀기", obstacles: [{x:5, y:3}, {x:6, y:4}] },
            { id: 15, type: 'triangle', start: {x: 4, y: 4}, shift: {dx: -3, dy: 3}, cmd: "왼쪽으로 3칸, 아래로 3칸 밀기", obstacles: [{x:2, y:5}] }
        ];

        this.currentPos = { x: 0, y: 0 };
    }

    start() {
        this.level = 1;
        this.statusLabel1.textContent = "스테이지";
        this.statusLabel2.textContent = "수행 명령";
        
        this.initLevel();
    }

    initLevel() {
        this.statusVal1.textContent = `${this.level} / ${this.maxLevel} LV`;
        const stage = this.stages[this.level - 1];
        this.statusVal2.textContent = stage.cmd;
        
        this.currentPos = { ...stage.start };
        
        this.renderGrid();
        this.setupControls();
    }

    renderGrid() {
        this.playfield.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.setAttribute('data-col', col);
                cell.setAttribute('data-row', row);
                this.playfield.appendChild(cell);
            }
        }

        // Draw static Wall Obstacles for this level
        const stage = this.stages[this.level - 1];
        stage.obstacles.forEach(o => {
            const wall = document.createElement('div');
            wall.className = 'grid-obstacle-block';
            wall.textContent = '🧱';
            
            wall.setAttribute('style', `
                position: absolute;
                left: ${o.x * 10}%;
                top: ${o.y * 10}%;
                width: 10%;
                height: 10%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.1rem;
                background: rgba(239, 68, 68, 0.25);
                border: 1px solid rgba(239, 68, 68, 0.5);
                border-radius: 4px;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
            `);
            
            this.playfield.appendChild(wall);
        });

        // Add Target Goal shadow outline (Hidden until correct submission)
        const targetX = stage.start.x + stage.shift.dx;
        const targetY = stage.start.y + stage.shift.dy;
        
        const goalEl = document.createElement('div');
        goalEl.className = 'grid-goal';
        goalEl.id = 'grid-goal-outline';
        goalEl.style.display = 'none'; // Hidden initially
        goalEl.style.left = `${targetX * 10}%`;
        goalEl.style.top = `${targetY * 10}%`;
        goalEl.style.width = '10%';
        goalEl.style.height = '10%';
        this.playfield.appendChild(goalEl);

        // Add Shape character
        const shapeEl = document.createElement('div');
        shapeEl.className = 'grid-shape';
        shapeEl.id = 'grid-shape-character';
        shapeEl.style.left = `${this.currentPos.x * 10}%`;
        shapeEl.style.top = `${this.currentPos.y * 10}%`;
        shapeEl.style.width = '10%';
        shapeEl.style.height = '10%';
        
        shapeEl.innerHTML = this.getShapeSVG(stage.type);
        this.playfield.appendChild(shapeEl);
    }

    getShapeSVG(type) {
        let path = '';
        if (type === 'triangle') {
            path = '<polygon points="50,12 88,82 12,82" stroke="#f59e0b" stroke-width="4" fill="rgba(245,158,11,0.25)" class="shape-svg-glow" />';
        } else if (type === 'square') {
            path = '<rect x="15" y="15" width="70" height="70" rx="8" stroke="#f59e0b" stroke-width="4" fill="rgba(245,158,11,0.25)" class="shape-svg-glow" />';
        } else if (type === 'parallelogram') {
            path = '<polygon points="35,15 85,15 65,85 15,85" stroke="#f59e0b" stroke-width="4" fill="rgba(245,158,11,0.25)" class="shape-svg-glow" />';
        } else if (type === 'cube') {
            path = `
                <polygon points="50,15 85,32 50,50 15,32" stroke="#f59e0b" stroke-width="3" fill="rgba(245,158,11,0.3)" />
                <polygon points="15,32 50,50 50,85 15,67" stroke="#f59e0b" stroke-width="3" fill="rgba(245,158,11,0.15)" />
                <polygon points="50,50 85,32 85,67 50,85" stroke="#f59e0b" stroke-width="3" fill="rgba(245,158,11,0.25)" />
            `;
        } else if (type === 'cone') {
            path = `
                <polygon points="50,10 15,70 50,85" stroke="#f59e0b" stroke-width="3" fill="rgba(245,158,11,0.3)" />
                <polygon points="50,10 85,70 50,85" stroke="#f59e0b" stroke-width="3" fill="rgba(245,158,11,0.15)" />
                <ellipse cx="50" cy="77" rx="35" ry="10" stroke="#f59e0b" stroke-width="2" fill="none" style="opacity: 0.3;" />
            `;
        }
        return `<svg viewBox="0 0 100 100" style="width:100%; height:100%;">${path}</svg>`;
    }

    setupControls() {
        this.controlsContainer.innerHTML = `
            <div>
                <p style="text-align:center; font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">🧱 장애물 벽을 피해서 안전하게 정답 위치로 평행이동 밀어주세요!</p>
                <div class="push-controls-panel">
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="ctrl-up">▲</button>
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="ctrl-left">◀</button>
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="ctrl-right">▶</button>
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="ctrl-down">▼</button>
                    <button class="push-control-btn empty"></button>
                </div>
            </div>
            <button class="word-check-btn" id="grid-submit-btn" style="background: linear-gradient(135deg, var(--success), #059669); margin-top:10px;">
                🔔 정답 제출하기
            </button>
        `;

        document.getElementById('ctrl-up').onclick = () => this.shiftShape(0, -1);
        document.getElementById('ctrl-down').onclick = () => this.shiftShape(0, 1);
        document.getElementById('ctrl-left').onclick = () => this.shiftShape(-1, 0);
        document.getElementById('ctrl-right').onclick = () => this.shiftShape(1, 0);
        
        document.getElementById('grid-submit-btn').onclick = () => this.evaluatePosition();

        this.keyHandler = (e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); this.shiftShape(0, -1); }
            if (e.key === 'ArrowDown') { e.preventDefault(); this.shiftShape(0, 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.shiftShape(-1, 0); }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.shiftShape(1, 0); }
        };
        window.addEventListener('keydown', this.keyHandler);
    }

    shiftShape(dx, dy) {
        const nx = this.currentPos.x + dx;
        const ny = this.currentPos.y + dy;
        
        if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
            // Collision check with obstacles!
            const stage = this.stages[this.level - 1];
            const collides = stage.obstacles.some(o => o.x === nx && o.y === ny);
            
            if (collides) {
                sound.playFailure();
                return; // block movement into wall
            }

            this.currentPos.x = nx;
            this.currentPos.y = ny;
            
            const shape = document.getElementById('grid-shape-character');
            if (shape) {
                shape.style.left = `${this.currentPos.x * 10}%`;
                shape.style.top = `${this.currentPos.y * 10}%`;
            }
            sound.playMove();
        }
    }

    evaluatePosition() {
        const stage = this.stages[this.level - 1];
        const correctX = stage.start.x + stage.shift.dx;
        const correctY = stage.start.y + stage.shift.dy;

        if (this.currentPos.x === correctX && this.currentPos.y === correctY) {
            // Reveal goal outline on success!
            const goal = document.getElementById('grid-goal-outline');
            if (goal) goal.style.display = 'block';

            sound.playWin();
            this.showOverlay(true, `딩동댕! 장애물을 피해 목표 위치로 완벽히 평행이동했습니다! (LV: ${this.level} / ${this.maxLevel})`, () => {
                if (this.level < this.maxLevel) {
                    this.level++;
                    this.initLevel();
                } else {
                    this.showOverlay(true, "축하합니다! 고송까 학생이 설계한 총 15단계의 장애물 격자 평행이동 문제를 모두 클리어하셨습니다! 🏆🎉", () => {
                        app.showDashboard();
                    }, "메인으로");
                }
            });
        } else {
            sound.playFailure();
            
            // Calculate displacement details
            const currentShiftX = this.currentPos.x - stage.start.x;
            const currentShiftY = this.currentPos.y - stage.start.y;
            
            // Requested shift vectors text
            const reqDxText = stage.shift.dx > 0 ? `오른쪽으로 ${stage.shift.dx}칸` : (stage.shift.dx < 0 ? `왼쪽으로 ${Math.abs(stage.shift.dx)}칸` : '');
            const reqDyText = stage.shift.dy > 0 ? `아래쪽으로 ${stage.shift.dy}칸` : (stage.shift.dy < 0 ? `위쪽으로 ${Math.abs(stage.shift.dy)}칸` : '');
            const separator = (reqDxText && reqDyText) ? ", " : "";
            const requestedVector = `${reqDxText}${separator}${reqDyText}`;
            
            // Player's actual shift vectors text
            const actDxText = currentShiftX > 0 ? `오른쪽으로 ${currentShiftX}칸` : (currentShiftX < 0 ? `왼쪽으로 ${Math.abs(currentShiftX)}칸` : '');
            const actDyText = currentShiftY > 0 ? `아래쪽으로 ${currentShiftY}칸` : (currentShiftY < 0 ? `위쪽으로 ${Math.abs(currentShiftY)}칸` : '');
            const actSeparator = (actDxText && actDyText) ? ", " : "";
            const actualVector = (actDxText || actDyText) ? `${actDxText}${actSeparator}${actDyText}` : '제자리';
            
            // Discrepancy vector calculation
            const diffX = stage.shift.dx - currentShiftX;
            const diffY = stage.shift.dy - currentShiftY;
            
            let discrepancyText = "";
            if (diffX !== 0) {
                discrepancyText += diffX > 0 ? `오른쪽으로 ${diffX}칸` : `왼쪽으로 ${Math.abs(diffX)}칸`;
            }
            if (diffY !== 0) {
                if (discrepancyText) discrepancyText += ", ";
                discrepancyText += diffY > 0 ? `아래쪽으로 ${diffY}칸` : `위쪽으로 ${Math.abs(diffY)}칸`;
            }
            
            let msg = `땡! 도형을 엉뚱한 위치로 밀었습니다.\n\n`;
            msg += `• 목표 지시: [${requestedVector}]\n`;
            msg += `• 나의 이동: [${actualVector}]\n\n`;
            msg += `👉 올바른 정답 위치에 가려면 여기서 [${discrepancyText}] 더 평행이동해야 합니다!`;
            
            if (this.level > 1) {
                this.level--;
                msg += `\n\n(패널티로 한 단계 이전 레벨로 복귀합니다! 😭)`;
            }
            
            this.showOverlay(false, msg, () => {
                this.initLevel();
            });
        }
    }

    showOverlay(win, message, action, buttonText = "계속하기") {
        const overlay = document.getElementById('game-overlay-screen');
        const title = document.getElementById('overlay-title');
        const desc = document.getElementById('overlay-desc');
        const btn = document.getElementById('overlay-action-btn');

        title.textContent = win ? "딩동댕! 🔔" : "땡! ❌";
        title.className = `overlay-title ${win ? 'win' : 'lose'}`;
        desc.textContent = message;
        btn.textContent = buttonText;
        
        btn.onclick = () => {
            overlay.classList.remove('active');
            action();
        };

        overlay.classList.add('active');
    }

    cleanup() {
        window.removeEventListener('keydown', this.keyHandler);
        this.playfield.innerHTML = '';
    }
}


// ==========================================================================
// 7. GAME 4: 물 컵 밀기 게임 (Water Cup Pushing Game - Ice Sliding Puzzle Refactor)
// ==========================================================================
class GameWaterCup {
    constructor() {
        this.arena = document.getElementById('cup-arena');
        this.cup = document.getElementById('cup-character');
        this.cupFluid = document.getElementById('cup-fluid');
        this.cupIcon = document.getElementById('cup-icon');
        
        this.statusVal1 = document.getElementById('status-val-1');
        this.statusVal2 = document.getElementById('status-val-2');
        this.statusLabel1 = document.getElementById('status-label-1');
        this.statusLabel2 = document.getElementById('status-label-2');
        this.controlsContainer = document.getElementById('interactive-controls-container');
        
        this.score = 0;
        this.targetCount = 5;
        
        this.fruits = ['orange', 'grape', 'apple', 'strawberry'];
        this.fruitNames = { orange: '오렌지', grape: '포도', apple: '그린사과', strawberry: '딸기' };
        this.fruitIcons = { orange: '🍊', grape: '🍇', apple: '🍏', strawberry: '🍓' };
        this.fruitColors = { orange: '#f97316', grape: '#8b5cf6', apple: '#10b981', strawberry: '#f43f5e' };
        
        this.targetFruit = '';
        this.isSliding = false;
        
        // Ice Grid properties
        this.gridSize = 7; // 7x7 grid
        this.cupPos = { r: 3, c: 3 }; // start at center
        
        // Obstacles (crates/ice blocks)
        this.obstacles = [
            { r: 2, c: 1 }, { r: 2, c: 5 },
            { r: 4, c: 1 }, { r: 4, c: 5 },
            { r: 1, c: 3 }, { r: 5, c: 3 }
        ];
    }

    start() {
        this.score = 0;
        this.statusLabel1.textContent = "완료 잔 수";
        this.statusLabel2.textContent = "요구 주스";
        
        this.initLevel();
    }

    initLevel() {
        this.statusVal1.textContent = `${this.score} / ${this.targetCount} 잔`;
        
        const lastTarget = this.targetFruit;
        do {
            this.targetFruit = this.fruits[Math.floor(Math.random() * this.fruits.length)];
        } while (this.targetFruit === lastTarget);
        
        this.statusVal2.textContent = `${this.fruitNames[this.targetFruit]} 주스! (${this.fruitIcons[this.targetFruit]})`;
        
        // Reset Cup Pos to center
        this.cupPos = { r: 3, c: 3 };
        this.isSliding = false;
        
        this.cup.style.transition = 'none';
        this.cup.style.left = 'calc(50% - 35px)';
        this.cup.style.top = 'calc(50% - 45px)';
        this.cup.style.transform = 'scale(1)';
        this.cupFluid.style.height = '15%';
        this.cupFluid.style.background = 'rgba(255,255,255,0.3)';
        this.cupIcon.textContent = '🥛';
        
        document.querySelectorAll('.dispenser').forEach(d => d.classList.remove('active'));

        this.renderIceArena();
        this.setupControls();
    }

    renderIceArena() {
        // Clear old blocks
        document.querySelectorAll('.ice-block').forEach(b => b.remove());
        
        const aRect = this.arena.getBoundingClientRect();
        const cellW = aRect.width / this.gridSize;
        const cellH = aRect.height / this.gridSize;
        
        // Draw static obstacles
        this.obstacles.forEach(o => {
            const block = document.createElement('div');
            block.className = 'ice-block';
            block.textContent = '❄️';
            block.setAttribute('style', `
                position: absolute;
                left: ${o.c * (100 / this.gridSize)}%;
                top: ${o.r * (100 / this.gridSize)}%;
                width: ${100 / this.gridSize}%;
                height: ${100 / this.gridSize}%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                background: rgba(255, 255, 255, 0.08);
                border: 1px dashed rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                box-shadow: inset 0 0 10px rgba(255,255,255,0.1);
            `);
            this.arena.appendChild(block);
        });

        // Set visual size of cup
        this.cup.style.width = `${aRect.width / this.gridSize * 0.8}px`;
        this.cup.style.height = `${aRect.height / this.gridSize * 0.9}px`;
        
        this.updateCupVisualPosition();
    }

    updateCupVisualPosition() {
        const percentage = 100 / this.gridSize;
        
        // Target coordinates offset center snap
        this.cup.style.left = `calc(${this.cupPos.c * percentage}% + ${percentage * 0.1}%)`;
        this.cup.style.top = `calc(${this.cupPos.r * percentage}% + ${percentage * 0.05}%)`;
    }

    setupControls() {
        this.controlsContainer.innerHTML = `
            <div>
                <p style="text-align:center; font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">📐 방향키 또는 아래 밀기 키로 얼음 격자 위로 컵을 평행이동 미세요!</p>
                <div class="push-controls-panel">
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="cup-ctrl-up">▲</button>
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="cup-ctrl-left">◀</button>
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="cup-ctrl-right">▶</button>
                    <button class="push-control-btn empty"></button>
                    <button class="push-control-btn" id="cup-ctrl-down">▼</button>
                    <button class="push-control-btn empty"></button>
                </div>
            </div>
        `;

        document.getElementById('cup-ctrl-up').onclick = () => this.slideCup(0, -1);
        document.getElementById('cup-ctrl-down').onclick = () => this.slideCup(0, 1);
        document.getElementById('cup-ctrl-left').onclick = () => this.slideCup(-1, 0);
        document.getElementById('cup-ctrl-right').onclick = () => this.slideCup(1, 0);

        this.keyHandler = (e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); this.slideCup(0, -1); }
            if (e.key === 'ArrowDown') { e.preventDefault(); this.slideCup(0, 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.slideCup(-1, 0); }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.slideCup(1, 0); }
        };
        window.addEventListener('keydown', this.keyHandler);
    }

    isObstacle(r, c) {
        return this.obstacles.some(o => o.r === r && o.c === c);
    }

    slideCup(dc, dr) {
        if (this.isSliding) return;
        this.isSliding = true;
        
        let curR = this.cupPos.r;
        let curC = this.cupPos.c;
        let moved = false;

        // Slide continuously until boundary or obstacle!
        while (true) {
            const nextR = curR + dr;
            const nextC = curC + dc;
            
            // Check grid boundaries
            if (nextR < 0 || nextR >= this.gridSize || nextC < 0 || nextC >= this.gridSize) break;
            // Check wall obstacles
            if (this.isObstacle(nextR, nextC)) break;
            
            curR = nextR;
            curC = nextC;
            moved = true;
        }

        if (moved) {
            this.cupPos.r = curR;
            this.cupPos.c = curC;
            
            this.cup.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
            this.updateCupVisualPosition();
            sound.playMove();
            
            // Check if landed on corner dispensers (corners: orange (0,0), grape (0,6), apple (6,0), strawberry (6,6))
            setTimeout(() => {
                this.evaluateLandedDispenser();
            }, 550);
        } else {
            this.isSliding = false;
        }
    }

    evaluateLandedDispenser() {
        const r = this.cupPos.r;
        const c = this.cupPos.c;
        let chosenFruit = null;
        let dispenserEl = null;

        if (r === 0 && c === 0) { chosenFruit = 'orange'; dispenserEl = document.querySelector('.dispenser.top-left'); }
        else if (r === 0 && c === this.gridSize - 1) { chosenFruit = 'grape'; dispenserEl = document.querySelector('.dispenser.top-right'); }
        else if (r === this.gridSize - 1 && c === 0) { chosenFruit = 'apple'; dispenserEl = document.querySelector('.dispenser.bottom-left'); }
        else if (r === this.gridSize - 1 && c === this.gridSize - 1) { chosenFruit = 'strawberry'; dispenserEl = document.querySelector('.dispenser.bottom-right'); }

        if (chosenFruit) {
            dispenserEl.classList.add('active');
            
            if (chosenFruit === this.targetFruit) {
                sound.playLiquid();
                
                this.cupFluid.style.background = this.fruitColors[chosenFruit];
                this.cupFluid.style.height = '85%';
                this.cupIcon.textContent = this.fruitIcons[chosenFruit];
                
                this.score++;
                this.statusVal1.textContent = `${this.score} / ${this.targetCount} 잔`;

                setTimeout(() => {
                    sound.playSuccess();
                    if (this.score >= this.targetCount) {
                        this.showOverlay(true, "대단해요! 얼음판 장애물을 미끄러져 밀며 기획한 5잔의 시원한 주스를 채우는 데 성공했습니다! 🍹🏆", () => {
                            app.showDashboard();
                        }, "메인으로");
                    } else {
                        this.initLevel();
                    }
                }, 1200);
            } else {
                sound.playFailure();
                this.cupFluid.style.background = '#64748b';
                this.cupFluid.style.height = '85%';
                this.cupIcon.textContent = '🤢';
                
                setTimeout(() => {
                    this.showOverlay(false, `과일 주스가 오염되었습니다! 요구 과일은 "${this.fruitNames[this.targetFruit]}(${this.fruitIcons[this.targetFruit]})"인데 "${this.fruitNames[chosenFruit]}(${this.fruitIcons[chosenFruit]})"로 잘못 밀었습니다!`, () => {
                        this.initLevel();
                    });
                }, 1000);
            }
        } else {
            // Not in any corner, sliding done
            this.isSliding = false;
        }
    }

    showOverlay(win, message, action, buttonText = "계속하기") {
        const overlay = document.getElementById('game-overlay-screen');
        const title = document.getElementById('overlay-title');
        const desc = document.getElementById('overlay-desc');
        const btn = document.getElementById('overlay-action-btn');

        title.textContent = win ? "참 잘했어요! ✨" : "주스 오염 발생! 🧪";
        title.className = `overlay-title ${win ? 'win' : 'lose'}`;
        desc.textContent = message;
        btn.textContent = buttonText;
        
        btn.onclick = () => {
            overlay.classList.remove('active');
            action();
        };

        overlay.classList.add('active');
    }

    cleanup() {
        window.removeEventListener('keydown', this.keyHandler);
        document.querySelectorAll('.ice-block').forEach(b => b.remove());
        this.cup.style.width = '70px'; // restore
        this.cup.style.height = '90px';
    }
}


// ==========================================================================
// 8. GAME 5: 사람을 미세요 (Push the Person - Coordinate Scaling & Explicit Math Refactor)
// ==========================================================================
class GamePushPerson {
    constructor() {
        this.fitWall = document.getElementById('fit-wall');
        this.fitHole = document.getElementById('fit-hole');
        this.fitHoleSvg = document.querySelector('.fit-hole-svg');
        this.stickman = document.getElementById('stick-man');
        
        this.statusVal1 = document.getElementById('status-val-1');
        this.statusVal2 = document.getElementById('status-val-2');
        this.statusLabel1 = document.getElementById('status-label-1');
        this.statusLabel2 = document.getElementById('status-label-2');
        this.controlsContainer = document.getElementById('interactive-controls-container');
        
        this.wave = 1;
        this.maxWave = 10;
        
        // Math coordinates mapping (X position values: -4, -2, 0, +2, +4)
        this.coords = [-4, -2, 0, 2, 4];
        this.coordsPercentages = [12, 31, 50, 69, 88];
        this.currentPosIndex = 2; // Starts at center coordinate X = 0
        this.selectedPoseId = 1;  
        this.holePosIndex = 0;
        this.holePoseId = 1;
        
        this.poses = {
            1: { name: '차렷 자세', leftArm: 'M 50 40 L 40 65', rightArm: 'M 50 40 L 60 65', leftLeg: 'M 50 60 L 45 90', rightLeg: 'M 50 60 L 55 90' },
            2: { name: '만세 자세', leftArm: 'M 50 40 L 30 15', rightArm: 'M 50 40 L 70 15', leftLeg: 'M 50 60 L 45 90', rightLeg: 'M 50 60 L 55 90' },
            3: { name: 'X형 자세', leftArm: 'M 50 40 L 25 25', rightArm: 'M 50 40 L 75 25', leftLeg: 'M 50 60 L 25 85', rightLeg: 'M 50 60 L 75 85' },
            4: { name: '외발서기', leftArm: 'M 50 40 L 40 65', rightArm: 'M 50 40 L 60 65', leftLeg: 'M 50 60 L 50 78 Q 40 75 40 85', rightLeg: 'M 50 60 L 55 90' },
            5: { name: '달리기 포즈', leftArm: 'M 50 40 L 35 50 Q 25 45 20 55', rightArm: 'M 50 40 L 65 30 L 75 20', leftLeg: 'M 50 60 L 35 85', rightLeg: 'M 50 60 L 65 75 Q 75 85 70 90' },
            6: { name: '옆으로 나란히', leftArm: 'M 50 40 L 20 40', rightArm: 'M 50 40 L 80 40', leftLeg: 'M 50 60 L 40 90', rightLeg: 'M 50 60 L 60 90' },
            7: { name: '오른손 경례', leftArm: 'M 50 40 L 40 65', rightArm: 'M 50 40 L 65 30 L 55 20', leftLeg: 'M 50 60 L 45 90', rightLeg: 'M 50 60 L 55 90' },
            8: { name: '쿵푸 자세', leftArm: 'M 50 40 Q 30 30 30 15', rightArm: 'M 50 40 L 75 40', leftLeg: 'M 50 60 Q 40 75 30 75', rightLeg: 'M 50 60 L 60 90' },
            9: { name: '큰대자 포즈', leftArm: 'M 50 40 L 15 35', rightArm: 'M 50 40 L 85 35', leftLeg: 'M 50 60 L 20 90', rightLeg: 'M 50 60 L 80 90' },
            10: { name: '사랑의 하트', leftArm: 'M 50 40 Q 30 15 50 5', rightArm: 'M 50 40 Q 70 15 50 5', leftLeg: 'M 50 60 L 45 90', rightLeg: 'M 50 60 L 55 90' }
        };

        this.wallTimer = null;
        this.wallY = 20;
    }

    start() {
        this.wave = 1;
        this.statusLabel1.textContent = "웨이브 통과";
        this.statusLabel2.textContent = "장벽 속도";
        
        this.initLevel();
        this.renderCoordinateRuler();
    }

    renderCoordinateRuler() {
        // Draw mathematical scale line in scene background
        document.querySelectorAll('.coord-ruler-mark').forEach(m => m.remove());
        const scene = document.getElementById('person-scene');
        
        this.coords.forEach((coord, index) => {
            const mark = document.createElement('div');
            mark.className = 'coord-ruler-mark';
            
            let label = coord === 0 ? "X = 0" : (coord > 0 ? `+${coord}` : `${coord}`);
            
            mark.innerHTML = `
                <div style="width:2px; height:12px; background:rgba(255,255,255,0.3); margin:0 auto;"></div>
                <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace; margin-top:2px;">${label}</div>
            `;
            
            mark.setAttribute('style', `
                position: absolute;
                bottom: 6px;
                left: ${this.coordsPercentages[index]}%;
                transform: translateX(-50%);
                text-align: center;
                pointer-events: none;
                z-index: 2;
            `);
            
            scene.appendChild(mark);
        });
    }

    initLevel() {
        this.statusVal1.textContent = `${this.wave - 1} / ${this.maxWave} 단계`;
        const speedText = this.wave <= 3 ? "천천히 🐢" : (this.wave <= 7 ? "중간 속도 🏃" : "질풍가도! ⚡");
        this.statusVal2.textContent = speedText;
        
        // Random hole configuration
        this.holePosIndex = Math.floor(Math.random() * this.coords.length);
        this.holePoseId = Math.floor(Math.random() * 10) + 1;
        
        this.fitHole.style.left = `${this.coordsPercentages[this.holePosIndex]}%`;
        this.drawPoseInSvg(this.fitHoleSvg, this.holePoseId);

        // Reset Character
        this.currentPosIndex = 2; // Center
        this.stickman.style.left = `${this.coordsPercentages[this.currentPosIndex]}%`;
        this.selectedPoseId = 1;
        this.drawPoseInSvg(document.getElementById('stick-svg'), this.selectedPoseId);
        
        // Start descending
        this.wallY = 20;
        this.fitWall.style.top = `${this.wallY}px`;
        
        this.setupControls();
        this.updateMathFeedback();
        
        if (this.wallTimer) clearInterval(this.wallTimer);
        const tickRate = 35 - this.wave * 1.5;
        
        this.wallTimer = setInterval(() => {
            this.wallY += 3;
            this.fitWall.style.top = `${this.wallY}px`;
            
            if (this.wallY >= 320 && this.wallY < 323) {
                this.evaluateAlign();
            }
        }, tickRate);
    }

    drawPoseInSvg(svgEl, poseId) {
        const pose = this.poses[poseId];
        let headHtml = '<circle cx="50" cy="20" r="10" />';
        let spineHtml = '<path d="M 50 30 L 50 60" />';
        
        let leftArmHtml = `<path d="${pose.leftArm}" id="stick-left-arm" />`;
        let rightArmHtml = `<path d="${pose.rightArm}" id="stick-right-arm" />`;
        let leftLegHtml = `<path d="${pose.leftLeg}" id="stick-left-leg" />`;
        let rightLegHtml = `<path d="${pose.rightLeg}" id="stick-right-leg" />`;
        
        svgEl.innerHTML = headHtml + spineHtml + leftArmHtml + rightArmHtml + leftLegHtml + rightLegHtml;
    }

    setupControls() {
        let poseButtonsHtml = '<div class="pose-select-bar">';
        for (let i = 1; i <= 10; i++) {
            poseButtonsHtml += `
                <button class="pose-btn ${i === this.selectedPoseId ? 'active' : ''}" id="pose-sel-${i}">
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="20" r="10" />
                        <path d="M 50 30 L 50 60" />
                        <path d="${this.poses[i].leftArm}" />
                        <path d="${this.poses[i].rightArm}" />
                        <path d="${this.poses[i].leftLeg}" />
                        <path d="${this.poses[i].rightLeg}" />
                    </svg>
                </button>
            `;
        }
        poseButtonsHtml += '</div>';

        let slideBtnsHtml = `
            <div class="slide-controls">
                <button class="slide-btn" id="btn-slide-left">◀ 왼쪽으로 2칸 밀기</button>
                <button class="slide-btn" id="btn-slide-right">오른쪽으로 2칸 밀기 ▶</button>
            </div>
            <!-- Math Realtime display board -->
            <div id="math-vector-board" style="text-align:center; background:rgba(99,102,241,0.06); padding:10px; border-radius:12px; border:1px solid rgba(99,102,241,0.15); margin-top:10px; font-family:monospace; font-size:0.9rem;">
                현재 좌표 X = 0
            </div>
        `;

        this.controlsContainer.innerHTML = poseButtonsHtml + slideBtnsHtml;

        for (let i = 1; i <= 10; i++) {
            document.getElementById(`pose-sel-${i}`).onclick = () => {
                document.querySelectorAll('.pose-btn').forEach(b => b.classList.remove('active'));
                document.getElementById(`pose-sel-${i}`).classList.add('active');
                
                this.selectedPoseId = i;
                this.drawPoseInSvg(document.getElementById('stick-svg'), i);
                sound.playSelect();
            };
        }

        document.getElementById('btn-slide-left').onclick = () => this.slidePerson(-1);
        document.getElementById('btn-slide-right').onclick = () => this.slidePerson(1);

        this.keyHandler = (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.slidePerson(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.slidePerson(1); }
        };
        window.addEventListener('keydown', this.keyHandler);
    }

    slidePerson(dir) {
        let nIndex = this.currentPosIndex + dir;
        if (nIndex >= 0 && nIndex < this.coords.length) {
            this.currentPosIndex = nIndex;
            this.stickman.style.left = `${this.coordsPercentages[this.currentPosIndex]}%`;
            sound.playMove();
            this.updateMathFeedback();
        }
    }

    updateMathFeedback() {
        const curCoord = this.coords[this.currentPosIndex];
        const board = document.getElementById('math-vector-board');
        
        if (board) {
            board.innerHTML = `현재 좌표: <strong style="color:var(--primary); font-size:1.05rem;">X = ${curCoord === 0 ? '0' : (curCoord > 0 ? `+${curCoord}` : curCoord)}</strong>`;
        }
    }

    evaluateAlign() {
        if (this.wallTimer) clearInterval(this.wallTimer);
        
        const isXAligned = (this.currentPosIndex === this.holePosIndex);
        const isPoseMatched = (this.selectedPoseId === this.holePoseId);

        if (isXAligned && isPoseMatched) {
            sound.playSuccess();
            this.wave++;
            
            this.fitWall.style.opacity = '0';
            
            setTimeout(() => {
                this.fitWall.style.opacity = '1';
                if (this.wave > this.maxWave) {
                    sound.playWin();
                    this.showOverlay(true, "완벽합니다! 벽에 뚫린 실루엣 구멍에 맞추어 X축 밀기(평행이동) 좌표를 정확히 통과시켰습니다! 🏆", () => {
                        app.showDashboard();
                    }, "메인으로");
                } else {
                    this.initLevel();
                }
            }, 800);
        } else {
            sound.playFailure();
            
            const curCoord = this.coords[this.currentPosIndex];
            const targetCoord = this.coords[this.holePosIndex];
            const vectorVal = targetCoord - curCoord;
            const dirName = vectorVal > 0 ? "오른쪽" : "왼쪽";
            
            let explanation = "쿵! 벽과 충돌했습니다. ";
            if (!isPoseMatched) {
                explanation += `<br>요구 자세: [${this.poses[this.holePoseId].name}]인데 [${this.poses[this.selectedPoseId].name}]를 골랐습니다!`;
            }
            if (!isXAligned) {
                explanation += `<br>현재 X좌표는 [${curCoord}]인데, 목표 좌표는 [${targetCoord}]였습니다. **[${dirName}으로 ${Math.abs(vectorVal)}칸]** 평행이동 밀기를 더 해야 통과할 수 있습니다!`;
            }
            
            this.showOverlay(false, explanation, () => {
                this.initLevel();
            });
        }
    }

    showOverlay(win, message, action, buttonText = "계속하기") {
        const overlay = document.getElementById('game-overlay-screen');
        const title = document.getElementById('overlay-title');
        const desc = document.getElementById('overlay-desc');
        const btn = document.getElementById('overlay-action-btn');

        title.textContent = win ? "통과 성공! ✨" : "장벽 충돌! 💥";
        title.className = `overlay-title ${win ? 'win' : 'lose'}`;
        desc.innerHTML = message;
        btn.textContent = buttonText;
        
        btn.onclick = () => {
            overlay.classList.remove('active');
            action();
        };

        overlay.classList.add('active');
    }

    cleanup() {
        if (this.wallTimer) clearInterval(this.wallTimer);
        window.removeEventListener('keydown', this.keyHandler);
        document.querySelectorAll('.coord-ruler-mark').forEach(m => m.remove());
    }
}


// ==========================================================================
// 9. GAME 6: 인형가게 (Doll Shop - Math Vector Assemblies Refactor)
// ==========================================================================
class GameDollShop {
    constructor() {
        this.workshop = document.getElementById('doll-workshop');
        this.bodyBase = document.getElementById('doll-body-base');
        
        this.statusVal1 = document.getElementById('status-val-1');
        this.statusVal2 = document.getElementById('status-val-2');
        this.statusLabel1 = document.getElementById('status-label-1');
        this.statusLabel2 = document.getElementById('status-label-2');
        this.controlsContainer = document.getElementById('interactive-controls-container');
        
        this.aiExpression = document.getElementById('ai-expression');
        this.aiScoreLabel = document.getElementById('ai-score-label');
        
        this.level = 1; // 1: Bear, 2: Rabbit
        this.maxLevel = 2;
        
        this.gameState = 'assemble'; // 'assemble' -> 'sewing' -> 'grading'
        this.activePartIndex = 0; // Assemblage sequential control
        this.sewingProgress = 0;
        
        // Parts configuration with exact grid coordinates translations
        this.partsData = {
            1: { // Bear
                name: "곰돌이 인형 수리",
                outline: "border-radius: 50% 50% 40% 40%; background: rgba(180, 83, 9, 0.15);",
                baseColor: "#b45309",
                parts: [
                    { id: 'ear-l', label: '왼쪽 귀 🐻', startPos: {x: 0, y: 0}, correctShift: {dx: 2, dy: -4}, currentShift: {dx: 0, dy: 0}, targetGrid: "오른쪽으로 2칸, 위쪽으로 4칸 밀기", icon: '🐻', style: 'border-radius:50%; width:45px; height:45px;' },
                    { id: 'ear-r', label: '오른쪽 귀 🐻', startPos: {x: 0, y: 0}, correctShift: {dx: 4, dy: -4}, currentShift: {dx: 0, dy: 0}, targetGrid: "오른쪽으로 4칸, 위쪽으로 4칸 밀기", icon: '🐻', style: 'border-radius:50%; width:45px; height:45px;' },
                    { id: 'arm-l', label: '왼쪽 팔 🐾', startPos: {x: 0, y: 0}, correctShift: {dx: 1, dy: 2}, currentShift: {dx: 0, dy: 0}, targetGrid: "오른쪽으로 1칸, 아래쪽으로 2칸 밀기", icon: '🐾', style: 'width:40px; height:60px; border-radius:20px;' },
                    { id: 'button-eye', label: '단추 눈 🔘', startPos: {x: 0, y: 0}, correctShift: {dx: 3, dy: -1}, currentShift: {dx: 0, dy: 0}, targetGrid: "오른쪽으로 3칸, 위쪽으로 1칸 밀기", icon: '🔘', style: 'width:30px; height:30px; font-size:1.1rem;' }
                ],
                sewVectorNodes: [
                    { x: 30, y: -45, label: "바느질 점 ①" },
                    { x: 80, y: -15, label: "바느질 점 ②" },
                    { x: 30, y: 15, label: "바느질 점 ③" },
                    { x: 80, y: 45, label: "바느질 점 ④" }
                ]
            },
            2: { // Rabbit
                name: "분홍 토끼 수리",
                outline: "border-radius: 40% 40% 30% 30%; background: rgba(244, 114, 182, 0.15);",
                baseColor: "#f472b6",
                parts: [
                    { id: 'ear-l', label: '긴 귀 (왼쪽) 🐰', startPos: {x: 0, y: 0}, correctShift: {dx: 2, dy: -5}, currentShift: {dx: 0, dy: 0}, targetGrid: "오른쪽으로 2칸, 위쪽으로 5칸 밀기", icon: '🐰', style: 'width:35px; height:85px; border-radius:40%;' },
                    { id: 'ear-r', label: '긴 귀 (오른쪽) 🐰', startPos: {x: 0, y: 0}, correctShift: {dx: 4, dy: -5}, currentShift: {dx: 0, dy: 0}, targetGrid: "오른쪽으로 4칸, 위쪽으로 5칸 밀기", icon: '🐰', style: 'width:35px; height:85px; border-radius:40%;' },
                    { id: 'ribbon-tie', label: '목 리본 🎀', startPos: {x: 0, y: 0}, correctShift: {dx: 3, dy: 1}, currentShift: {dx: 0, dy: 0}, targetGrid: "오른쪽으로 3칸, 아래쪽으로 1칸 밀기", icon: '🎀', style: 'width:45px; height:45px; font-size:1.6rem;' },
                    { id: 'arm-r', label: '오른쪽 팔 🐾', startPos: {x: 0, y: 0}, correctShift: {dx: 5, dy: 2}, currentShift: {dx: 0, dy: 0}, targetGrid: "오른쪽으로 5칸, 아래쪽으로 2칸 밀기", icon: '🐾', style: 'width:40px; height:60px; border-radius:20px;' }
                ],
                sewVectorNodes: [
                    { x: 20, y: -70, label: "바느질 점 ①" },
                    { x: 75, y: -30, label: "바느질 점 ②" },
                    { x: 20, y: 10, label: "바느질 점 ③" },
                    { x: 75, y: 50, label: "바느질 점 ④" }
                ]
            }
        };

        // Grid parameters inside doll workshop
        this.cellSize = 40; // pixel size per coordinate unit
    }

    start() {
        this.level = 1;
        this.statusLabel1.textContent = "복원 인형";
        this.statusLabel2.textContent = "작업 공정";
        
        this.initLevel();
    }

    initLevel() {
        this.gameState = 'assemble';
        this.activePartIndex = 0;
        this.sewingProgress = 0;
        this.assemblyErrors = 0;
        this.sewingErrors = 0;
        
        const data = this.partsData[this.level];
        this.statusVal1.textContent = data.name;
        this.statusVal2.textContent = "1. 파츠 조립 정렬";
        
        this.aiExpression.setAttribute('d', 'M 35 55 Q 50 65 65 55');
        this.aiScoreLabel.textContent = "AI 평가: -점";

        // Draw static body outline
        this.bodyBase.setAttribute('style', data.outline);
        this.bodyBase.classList.remove('active');
        this.bodyBase.innerHTML = '';
        
        const canvas = document.getElementById('sewing-line-overlay');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        document.getElementById('sewing-nodes-container').innerHTML = '';
        document.getElementById('doll-parts-container').innerHTML = '';

        // Reset parts current shifts
        data.parts.forEach(p => {
            p.currentShift = { dx: 0, dy: 0 };
        });

        this.spawnPartTiles();
        this.setupControls();
    }

    spawnPartTiles() {
        // Remove old elements
        document.querySelectorAll('.doll-part-element').forEach(el => el.remove());
        document.querySelectorAll('.doll-part-ghost-element').forEach(el => el.remove());
        const data = this.partsData[this.level];
        const wRect = this.workshop.getBoundingClientRect();
        const baseRect = this.bodyBase.getBoundingClientRect();
        
        // Base center local coordinates
        const localBaseX = baseRect.left - wRect.left;
        const localBaseY = baseRect.top - wRect.top;
        
        // Renders all parts on their starting positions on the left side of base
        data.parts.forEach((p, idx) => {
            const el = document.createElement('div');
            el.className = 'doll-part-element';
            el.id = `doll-part-${p.id}`;
            el.textContent = p.icon;
            
            // Standard start local position: left of the body, coordinate offset (0, 0)
            const sx = localBaseX - 80;
            const sy = localBaseY + baseRect.height / 2 - 20;
            
            const px = sx + p.currentShift.dx * this.cellSize;
            const py = sy + p.currentShift.dy * this.cellSize;
            
            const isActive = (idx === this.activePartIndex && this.gameState === 'assemble');
            
            el.setAttribute('style', `
                position: absolute;
                left: ${px}px;
                top: ${py}px;
                background: ${data.baseColor};
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid ${isActive ? '#fff' : 'rgba(255,255,255,0.1)'};
                box-shadow: ${isActive ? '0 0 15px var(--accent-glow)' : 'none'};
                opacity: ${idx < this.activePartIndex ? '1' : (isActive ? '1' : '0.45')};
                pointer-events: none;
                z-index: ${isActive ? '100' : '10'};
                ${p.style || ''}
            `);
            
            this.workshop.appendChild(el);

            // Render a faint dotted outline on the doll's body base where the active part is supposed to go
            if (isActive) {
                const ghost = document.createElement('div');
                ghost.className = 'doll-part-ghost-element';
                ghost.textContent = p.icon;
                
                const targetX = sx + p.correctShift.dx * this.cellSize;
                const targetY = sy + p.correctShift.dy * this.cellSize;
                
                ghost.setAttribute('style', `
                    position: absolute;
                    left: ${targetX}px;
                    top: ${targetY}px;
                    background: rgba(255, 255, 255, 0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px dashed rgba(255, 255, 255, 0.4);
                    box-shadow: 0 0 8px rgba(255, 255, 255, 0.1) inset;
                    opacity: 0.75;
                    pointer-events: none;
                    z-index: 5;
                    color: rgba(255, 255, 255, 0.25);
                    filter: grayscale(100%);
                    ${p.style || ''}
                `);
                this.workshop.appendChild(ghost);
            }
        });
    }

    setupControls() {
        if (this.gameState === 'assemble') {
            const data = this.partsData[this.level];
            const p = data.parts[this.activePartIndex];
            
            this.controlsContainer.innerHTML = `
                <div>
                    <h4 style="margin-bottom:6px; font-size:1rem;">🧩 조립할 파츠: <span style="color:var(--accent);">${p.label}</span></h4>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">조작판으로 평행이동하여 점선 테두리에 맞춰 끼우세요!</p>
                    
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:8px 12px; border-radius:12px; font-family:monospace; font-size:0.85rem; margin-bottom:10px;">
                        <span style="color:var(--text-muted);">현재 평행이동:</span><br>
                        <strong>오른쪽으로 ${p.currentShift.dx}칸, 아래로 ${p.currentShift.dy}칸</strong>
                    </div>

                    <div class="push-controls-panel" style="margin-bottom:10px;">
                        <button class="push-control-btn empty"></button>
                        <button class="push-control-btn" id="part-up">▲</button>
                        <button class="push-control-btn empty"></button>
                        <button class="push-control-btn" id="part-left">◀</button>
                        <button class="push-control-btn empty"></button>
                        <button class="push-control-btn" id="part-right">▶</button>
                        <button class="push-control-btn empty"></button>
                        <button class="push-control-btn" id="part-down">▼</button>
                        <button class="push-control-btn empty"></button>
                    </div>
                </div>
                <button class="word-check-btn" id="part-submit-btn" style="background: linear-gradient(135deg, var(--success), #059669);">
                    🔩 맞춤 밀기 확인
                </button>
            `;

            document.getElementById('part-up').onclick = () => this.shiftPart(0, -1);
            document.getElementById('part-down').onclick = () => this.shiftPart(0, 1);
            document.getElementById('part-left').onclick = () => this.shiftPart(-1, 0);
            document.getElementById('part-right').onclick = () => this.shiftPart(1, 0);
            
            document.getElementById('part-submit-btn').onclick = () => this.evaluatePartPlacement();
        } else if (this.gameState === 'sewing') {
            // Sewing Stage Controls
            const data = this.partsData[this.level];
            const nodeInfo = data.sewVectorNodes[this.sewingProgress];
            
            this.controlsContainer.innerHTML = `
                <div>
                    <h4 style="color:var(--accent); margin-bottom:6px; font-size:1rem;">🧵 바느질 지그재그 밀기</h4>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px;">실바늘의 대각선 밀기 방향 벡터를 맞추어 클릭하세요!</p>
                    
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:10px; border-radius:12px; font-family:monospace; font-size:0.85rem; margin-bottom:10px;">
                        현재 목표 지점: <strong style="color:var(--accent);">${nodeInfo.label}</strong>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr; gap:8px;">
                        <button class="action-btn" id="sew-vector-dr">오른쪽 아래 대각선 방향 (↘)</button>
                        <button class="action-btn" id="sew-vector-dl">왼쪽 아래 대각선 방향 (↙)</button>
                    </div>
                </div>
            `;

            document.getElementById('sew-vector-dr').onclick = () => this.shiftNeedle('dr');
            document.getElementById('sew-vector-dl').onclick = () => this.shiftNeedle('dl');
        } else if (this.gameState === 'grading') {
            this.controlsContainer.innerHTML = `
                <button class="word-check-btn" id="btn-submit-grading" style="background: linear-gradient(135deg, var(--accent), var(--secondary));">
                    🤖 TV 머리 AI 로봇에게 수리 완료 제출
                </button>
            `;
            document.getElementById('btn-submit-grading').onclick = () => this.triggerAIEvaluation();
        }
    }

    shiftPart(dx, dy) {
        const data = this.partsData[this.level];
        const p = data.parts[this.activePartIndex];
        
        p.currentShift.dx += dx;
        p.currentShift.dy += dy;
        
        sound.playMove();
        this.spawnPartTiles();
        this.setupControls();
    }

    evaluatePartPlacement() {
        const data = this.partsData[this.level];
        const p = data.parts[this.activePartIndex];
        
        if (p.currentShift.dx === p.correctShift.dx && p.currentShift.dy === p.correctShift.dy) {
            // Perfect shift placement snaps!
            sound.playSuccess();
            this.activePartIndex++;
            
            if (this.activePartIndex >= data.parts.length) {
                setTimeout(() => {
                    this.initSewingStage();
                }, 500);
            } else {
                this.spawnPartTiles();
                this.setupControls();
            }
        } else {
            // Incorrect shift translation
            sound.playFailure();
            this.assemblyErrors++;
            
            const reqDx = p.correctShift.dx - p.currentShift.dx;
            const reqDy = p.correctShift.dy - p.currentShift.dy;
            
            let tipX = reqDx > 0 ? `오른쪽으로 ${reqDx}칸` : (reqDx < 0 ? `왼쪽으로 ${Math.abs(reqDx)}칸` : '');
            let tipY = reqDy > 0 ? `아래쪽으로 ${reqDy}칸` : (reqDy < 0 ? `위쪽으로 ${Math.abs(reqDy)}칸` : '');
            let connector = (tipX && tipY) ? ", " : "";
            
            this.showToast(`삐익! 정렬 실패! [${tipX}${connector}${tipY}] 더 밀어야 완벽히 끼워집니다!`);
            
            // Bounce back
            p.currentShift = { dx: 0, dy: 0 };
            this.spawnPartTiles();
            this.setupControls();
        }
    }

    initSewingStage() {
        this.gameState = 'sewing';
        this.sewingProgress = 0;
        this.statusVal2.textContent = "2. 실 봉합 대각선 밀기";
        sound.playWin();

        this.showToast("모든 파츠 밀기 조립 완료! 이제 대각선 바느질 밀기를 진행해 주세요!");

        // Render sewing dots visually
        const nodesContainer = document.getElementById('sewing-nodes-container');
        const data = this.partsData[this.level];
        const wRect = this.workshop.getBoundingClientRect();
        const baseRect = this.bodyBase.getBoundingClientRect();
        const localBaseX = baseRect.left - wRect.left;
        const localBaseY = baseRect.top - wRect.top;
        
        data.sewVectorNodes.forEach((node, index) => {
            const dot = document.createElement('div');
            dot.className = `sewing-node ${index === 0 ? 'active' : ''}`;
            
            const px = localBaseX + baseRect.width / 2 + node.x;
            const py = localBaseY + baseRect.height / 2 + node.y;
            
            dot.style.left = `${px}px`;
            dot.style.top = `${py}px`;
            
            nodesContainer.appendChild(dot);
        });
        
        this.setupControls();
    }

    shiftNeedle(dir) {
        const data = this.partsData[this.level];
        
        // Correct vector sequence: Point 1 to 2 is DR, 2 to 3 is DL, 3 to 4 is DR
        const correctDirs = { 0: 'dr', 1: 'dl', 2: 'dr' }; // index 0 means moving from 1 to 2
        const targetDir = correctDirs[this.sewingProgress];
        
        if (dir === targetDir) {
            // Correct diagonal needle shift!
            this.sewingProgress++;
            sound.playSew();
            
            // Mark node completed
            const nodes = document.querySelectorAll('.sewing-node');
            nodes[this.sewingProgress - 1].classList.remove('active');
            nodes[this.sewingProgress - 1].classList.add('done');
            if (nodes[this.sewingProgress]) {
                nodes[this.sewingProgress].classList.add('active');
            }

            this.drawSewingLine();
            this.setupControls();

            if (this.sewingProgress >= data.sewVectorNodes.length - 1) {
                setTimeout(() => {
                    this.gameState = 'grading';
                    this.statusVal2.textContent = "3. AI 로봇 최종 평가";
                    sound.playSuccess();
                    this.setupControls();
                }, 500);
            }
        } else {
            // Incorrect needle direction vector
            sound.playFailure();
            this.sewingErrors++;
            this.showToast("실바늘의 바느질 대각선 밀기 방향이 다릅니다! 침착히 대각선 벡터를 다시 골라주세요!");
        }
    }

    drawSewingLine() {
        const canvas = document.getElementById('sewing-line-overlay');
        const ctx = canvas.getContext('2d');
        const nodes = document.querySelectorAll('.sewing-node');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        for (let i = 0; i <= this.sewingProgress; i++) {
            const el = nodes[i];
            if (el) {
                const lx = parseFloat(el.style.left);
                const ly = parseFloat(el.style.top);
                if (i === 0) ctx.moveTo(lx, ly);
                else ctx.lineTo(lx, ly);
            }
        }
        ctx.stroke();
    }

    async triggerAIEvaluation() {
        sound.playMove();
        
        const scoreLabel = document.getElementById('ai-score-label');
        let ticks = 0;
        
        // 1. Start loading animation (AI face blinking and thinking state)
        const loadingInterval = setInterval(() => {
            ticks++;
            const mockScore = Math.floor(Math.random() * 50) + 50;
            scoreLabel.textContent = `AI 분석 연산 중... (${mockScore}점)`;
            
            const expressions = [
                'M 30 50 Q 50 60 70 50', // neutral
                'M 35 60 Q 50 50 65 60', // sad
                'M 35 55 Q 50 65 65 55', // smile
                'M 30 45 L 70 45'        // straight
            ];
            this.aiExpression.setAttribute('d', expressions[Math.floor(Math.random() * expressions.length)]);
        }, 100);

        // 2. Compute the dynamic performance score (at least 60)
        const finalScore = Math.max(60, 100 - (this.assemblyErrors + this.sewingErrors) * 10);
        const apiKey = localStorage.getItem('openai_api_key');
        
        let aiFeedbackText = "";
        let isOnline = false;

        // 3. Query OpenAI API if key exists
        if (apiKey) {
            try {
                const systemPrompt = `당신은 초등 수학 교과 과정(4학년 1학기 평행이동 '도형 밀기' 단원)을 기반으로 게임을 채점하고 피드백을 주는 귀여운 TV-head 형태의 레트로 인공지능 로봇 튜터 '티비봇'입니다. 학생의 인형 조립 밀기 실수(assembly errors: ${this.assemblyErrors}회)와 대각선 벡터 바느질 실수(sewing errors: ${this.sewingErrors}회), 그리고 최종 점수(${finalScore}점)를 분석하여 매우 유쾌하고 칭찬이 가득한 격려의 로봇 진단 평가를 한국어로 내려주세요. 말투는 반드시 귀엽고 통통 튀는 레트로 로봇 말투('~다봇!', '삐리빅!', '연산 완료!', '업그레이드 완료!')를 써야 합니다. 초등학생 대상이므로 평행이동(밀기) 개념을 칭찬하거나 지지해주어야 하며, 딱딱한 말투를 지양하고 이모지와 친근한 표현을 잔뜩 넣어주세요. 줄바꿈을 포함하여 3문장 이내로 작성해 주세요.`;
                
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `조립 밀기 실수: ${this.assemblyErrors}회, 바느질 실수: ${this.sewingErrors}회, 최종 점수: ${finalScore}점.` }
                        ],
                        max_tokens: 250,
                        temperature: 0.7
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    aiFeedbackText = data.choices[0].message.content.trim();
                    isOnline = true;
                } else {
                    console.warn('API response error, falling back to offline diagnostic.');
                }
            } catch (error) {
                console.error('AI Diagnostic Error:', error);
            }
        }

        // 4. Offline Fallback Mode
        if (!isOnline) {
            aiFeedbackText = `삐리빅! 로컬 임시 연산 장치 가동! 🛠️ 조립 실수 ${this.assemblyErrors}회, 바느질 실수 ${this.sewingErrors}회로 정밀 복원을 완료했다봇! 평행이동과 대각선 바느질의 규칙을 멋지게 실천했다봇, 삐리빅! ⚙️<br><br>🧙‍♂️ 화면 우측 상단의 <strong>[⚙️ AI 설정]</strong>을 누르고 OpenAI API Key를 등록하면, 티비봇과 오즈 쌤의 훨씬 더 똑똑하고 따뜻한 실시간 AI 수학 진단 코칭 카드를 받을 수 있다봇! 꼭 등록해줘봇!`;
        }

        // 5. Stop loading animation & update UI
        clearInterval(loadingInterval);
        
        scoreLabel.textContent = `AI 채점: ${finalScore}점`;
        this.aiExpression.setAttribute('d', 'M 35 55 Q 50 65 65 55'); // Happy face
        sound.playWin();

        const diagHTML = `
            축하합니다! AI 채점결과 "${finalScore}점"을 획득하여 완벽하게 정밀 격자 바느질 수리에 대성공하였습니다! 🎉🧸
            <div class="ai-diag-card">
                <div class="ai-diag-robot-avatar">🤖</div>
                <div class="ai-diag-content">
                    <h4>티비봇 AI 정밀 수학 진단서</h4>
                    <p>조립 실수: ${this.assemblyErrors}회, 바느질 실수: ${this.sewingErrors}회<br>
                    <strong>최종 점수: ${finalScore}점</strong><br><br>
                    ${aiFeedbackText}</p>
                </div>
            </div>
        `;

        this.showOverlay(true, diagHTML, () => {
            if (this.level < this.maxLevel) {
                this.level++;
                this.initLevel();
            } else {
                const finalVictoryHTML = `
                    대단해요! 진라면 학생이 디자인한 곰돌이와 토끼 인형들을 격자 평행이동 밀기 조립과 대각선 봉합으로 모두 완벽히 치료했습니다! 🏆💖
                    <div class="ai-diag-card">
                        <div class="ai-diag-robot-avatar">🤖</div>
                        <div class="ai-diag-content">
                            <h4>티비봇 최종 마스터 평가 완료!</h4>
                            <p>축하합니다! 6개 단계의 모든 수학 미션을 완파하며 평행이동과 밀기 공정을 완벽하게 정복했습니다! 수학 챔피언으로 임명한다봇, 삐리빅! ⚙️🏆</p>
                        </div>
                    </div>
                `;
                this.showOverlay(true, finalVictoryHTML, () => {
                    app.showDashboard();
                }, "메인으로");
            }
        });
    }

    showToast(msg) {
        sound.playSelect();
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.setAttribute('style', `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15,23,42,0.95);
            border: 1px solid var(--primary);
            color: #fff;
            padding: 10px 20px;
            border-radius: 12px;
            font-size: 0.9rem;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            pointer-events: none;
            transition: all 0.3s ease;
        `);
        this.workshop.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showOverlay(win, message, action, buttonText = "계속하기") {
        const overlay = document.getElementById('game-overlay-screen');
        const title = document.getElementById('overlay-title');
        const desc = document.getElementById('overlay-desc');
        const btn = document.getElementById('overlay-action-btn');

        title.textContent = win ? "최종 합격! ✨" : "수리 보완 필요! 😭";
        title.className = `overlay-title ${win ? 'win' : 'lose'}`;
        desc.innerHTML = message;
        btn.textContent = buttonText;
        
        btn.onclick = () => {
            overlay.classList.remove('active');
            action();
        };

        overlay.classList.add('active');
    }

    cleanup() {
        document.querySelectorAll('.doll-part-element').forEach(el => el.remove());
        document.getElementById('sewing-nodes-container').innerHTML = '';
    }
}


// ==========================================================================
// 10. Start Global Web Application
// ==========================================================================
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new AppController();
});
