// JavaScript para a página da carta - Música "Me and Your Mama"
(function(){
    // --- Background audio: Me and Your Mama em loop ---
    const audioSrc = 'audio/Me and Your Mama (corrigido).mp3';
    const bgAudio = new Audio(audioSrc);
    bgAudio.loop = true;
    bgAudio.preload = 'auto';
    bgAudio.volume = 0.6;
    // expose for debugging
    window.bgAudio = bgAudio;

    // volume control: connect to slider .level inside #volume-slider
    let previousVolume = bgAudio.volume;

    function updateSliderIconColor(volume){
        const label = document.getElementById('volume-slider');
        if(!label) return;
        const root = getComputedStyle(document.documentElement);
        const accent = root.getPropertyValue('--accent') || '#ff6b81';
        const mutedColor = root.getPropertyValue('--muted') || '#6b6b6b';
        const color = (volume > 0.03) ? accent.trim() : mutedColor.trim();
        label.style.setProperty('--icon-color', color);
        
        // Atualizar cor do ícone do volume diretamente
        const volumeIcon = document.querySelector('#volume-slider .volume');
        if(volumeIcon) {
            volumeIcon.style.fill = color;
        }
    }

    function bindVolumeSlider(){
        const input = document.querySelector('#volume-slider .level');
        const icon = document.querySelector('#volume-slider .volume');
        if(!input) return;
        input.value = Math.round(bgAudio.volume * 100);
        updateSliderIconColor(bgAudio.volume);

        input.addEventListener('input', (e) => {
            const v = Number(e.target.value) / 100;
            bgAudio.volume = v;
            if(v > 0) previousVolume = v;
            if(bgAudio.muted && v > 0) bgAudio.muted = false;
            updateSliderIconColor(v);
        });

        // click on icon toggles mute
        if(icon){
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                if(bgAudio.muted || bgAudio.volume === 0){
                    bgAudio.muted = false;
                    bgAudio.volume = previousVolume || 0.6;
                    input.value = Math.round(bgAudio.volume * 100);
                    updateSliderIconColor(bgAudio.volume);
                    // try to play in case it was blocked
                    bgAudio.play().catch(()=>{});
                } else {
                    bgAudio.muted = true;
                    input.value = 0;
                    updateSliderIconColor(0);
                }
            });
        }
    }

    function hideEnableButton(){
        const btn = document.getElementById('enable-audio-btn');
        if(btn) btn.remove();
    }

    function showEnableButton(){
        if(document.getElementById('enable-audio-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'enable-audio-btn';
        btn.className = 'activate-sound-btn';
        btn.textContent = 'Ativar som';
        btn.setAttribute('aria-label','Ativar som de fundo');
        btn.addEventListener('click', function(){
            bgAudio.play().then(()=>{ hideEnableButton(); }).catch(()=>{});
        });
        // try to place button under the volume controls container; fallback to body
        const container = document.querySelector('.audio-controls');
        if(container) container.appendChild(btn);
        else document.body.appendChild(btn);
    }

    function tryPlayAudio(){
        bgAudio.play().then(()=>{
            hideEnableButton();
        }).catch(()=>{
            // autoplay bloqueado: mostrar botão para que o usuário ative o áudio
            showEnableButton();
        });
    }

    // Botões de play/pause
    const playBtn = document.getElementById('play-music-btn');
    const pauseBtn = document.getElementById('pause-music-btn');

    function updatePlayPauseButtons(){
        if(!playBtn || !pauseBtn) return;
        if(bgAudio.paused){
            playBtn.style.display = 'inline-flex';
            pauseBtn.style.display = 'none';
        } else {
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-flex';
        }
    }

    if(playBtn){
        playBtn.addEventListener('click', ()=>{
            bgAudio.play().then(()=>{
                updatePlayPauseButtons();
                hideEnableButton();
            }).catch(()=>{});
        });
    }

    if(pauseBtn){
        pauseBtn.addEventListener('click', ()=>{
            bgAudio.pause();
            updatePlayPauseButtons();
        });
    }

    // Atualizar botões quando o áudio mudar de estado
    bgAudio.addEventListener('play', updatePlayPauseButtons);
    bgAudio.addEventListener('pause', updatePlayPauseButtons);
    bgAudio.addEventListener('ended', updatePlayPauseButtons);

    // Inicializar estado dos botões
    function initializeAudio(){
        updatePlayPauseButtons();
        bindVolumeSlider();
    }

    // Inicializar quando a página carregar
    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', function(){
            initializeAudio();
            // Tentar tocar após um pequeno delay para melhor compatibilidade
            setTimeout(tryPlayAudio, 500);
        });
    } else {
        initializeAudio();
        setTimeout(tryPlayAudio, 500);
    }

    // também tentar novamente quando houver interação do usuário na página
    ['click','touchstart','keydown'].forEach(ev => {
        window.addEventListener(ev, function once(){
            tryPlayAudio();
            // remover o listener para não chamar repetidamente
            window.removeEventListener(ev, once);
        }, {passive:true});
    });

})();