// Cronômetro que calcula anos, meses, dias, horas, minutos e segundos desde 18/03/2025
(function(){
    const startDate = new Date(2025, 2, 18, 0, 0, 0); // mês 2 = março (JS: 0=jan)

    const elYears = document.getElementById('years');
    const elMonths = document.getElementById('months');
    const elDays = document.getElementById('days');
    const elHours = document.getElementById('hours');
    const elMinutes = document.getElementById('minutes');
    const elSeconds = document.getElementById('seconds');

    function pad(n){ return String(n).padStart(2,'0'); }

    function computeParts(from, to){
        // from: Date start, to: Date now
        let y=0,m=0;
        let temp = new Date(from.getTime());

        // contar anos
        while(true){
            let next = new Date(temp.getFullYear()+1, temp.getMonth(), temp.getDate(), temp.getHours(), temp.getMinutes(), temp.getSeconds());
            if(next <= to){ temp = next; y++; } else break;
        }

        // contar meses
        while(true){
            let next = new Date(temp.getFullYear(), temp.getMonth()+1, temp.getDate(), temp.getHours(), temp.getMinutes(), temp.getSeconds());
            if(next <= to){ temp = next; m++; } else break;
        }

        // resto em ms
        let diff = to - temp;
        let days = Math.floor(diff / (1000*60*60*24)); diff -= days*(1000*60*60*24);
        let hours = Math.floor(diff / (1000*60*60)); diff -= hours*(1000*60*60);
        let minutes = Math.floor(diff / (1000*60)); diff -= minutes*(1000*60);
        let seconds = Math.floor(diff / 1000);

        return {years:y, months:m, days:days, hours:hours, minutes:minutes, seconds:seconds};
    }

    function setNumAttributes(el, value){
        if(!el) return;
        el.textContent = value;
        el.setAttribute('data-num', value);
        el.setAttribute('data-num-next', value);
    }

    function update(){
        const now = new Date();
        const parts = computeParts(startDate, now);

        setNumAttributes(elYears, parts.years);
        setNumAttributes(elMonths, parts.months);
        setNumAttributes(elDays, parts.days);
        setNumAttributes(elHours, pad(parts.hours));
        setNumAttributes(elMinutes, pad(parts.minutes));
        setNumAttributes(elSeconds, pad(parts.seconds));
    }

    // Atualiza imediatamente e depois a cada segundo
    update();
    setInterval(update, 1000);

    // opcional: permitir que o usuário troque imagens arrastando-as para as áreas (básico)
    function enableDrop(id){
        const el = document.getElementById(id);
        el.addEventListener('dragover', e=>{ e.preventDefault(); el.style.opacity=0.9 });
        el.addEventListener('dragleave', e=>{ el.style.opacity=1 });
        el.addEventListener('drop', e=>{
            e.preventDefault(); el.style.opacity=1;
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = function(ev){ el.style.backgroundImage = `url('${ev.target.result}')`; }
            reader.readAsDataURL(file);
        });
    }
    enableDrop('photoLeft');
    enableDrop('photoCenter');
    enableDrop('photoRight');

    const presetPhotos = [
        { id: 'photoLeft', src: 'assets/img/Foto 1.jpg' },
        { id: 'photoCenter', src: 'assets/img/Foto 5.jpg' },
        { id: 'photoRight', src: 'assets/img/Foto 2.jpg' }
    ];
    presetPhotos.forEach(item => {
        const el = document.getElementById(item.id);
        if(el && !el.style.backgroundImage){
            el.style.backgroundImage = `url('${item.src}')`;
        }
    });

    // --- Background audio: tenta tocar em loop e exibe botão se autoplay for bloqueado ---
    // Detecta se está na página de cartas para usar o caminho correto
    const isCartaPage = window.location.pathname.includes('carta');
    const audioSrc = isCartaPage ? 'audio/Me and Your Mama (corrigido).mp3' : 'assets/audio/Saturno.mp3';
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

    // tentar tocar logo que a página carrega
    tryPlayAudio();

    // bind volume slider after DOM is ready
    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', bindVolumeSlider);
    } else bindVolumeSlider();

    // também tentar novamente quando houver interação do usuário na página (ex: toque/teclado)
    ['click','touchstart','keydown'].forEach(ev => {
        window.addEventListener(ev, function once(){
            tryPlayAudio();
            // remover o listener para não chamar repetidamente
            window.removeEventListener(ev, once);
        }, {passive:true});
    });

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
    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', updatePlayPauseButtons);
    } else {
        updatePlayPauseButtons();
    }

    /* --------- Galeria e loader --------- */
    const galleryButton = document.getElementById('open-gallery');
    const loaderOverlay = document.getElementById('loader-overlay');
    const galleryPanel = document.getElementById('gallery-panel');
    const closeGalleryButton = document.getElementById('close-gallery');

    function toggleLoader(state){
        if(!loaderOverlay) return;
        loaderOverlay.classList[state ? 'add' : 'remove']('active');
        loaderOverlay.setAttribute('aria-hidden', state ? 'false' : 'true');
    }

    function lockScroll(lock){
        document.body.style.overflow = lock ? 'hidden' : '';
    }

    function openGallery(){
        if(!galleryPanel) return;
        toggleLoader(true);
        setTimeout(()=>{
            toggleLoader(false);
            galleryPanel.classList.add('visible');
            galleryPanel.setAttribute('aria-hidden','false');
            lockScroll(true);
        },1000);
    }

    function closeGallery(){
        if(!galleryPanel) return;
        toggleLoader(false);
        galleryPanel.classList.remove('visible');
        galleryPanel.setAttribute('aria-hidden','true');
        lockScroll(false);
    }

    if(galleryButton){
        galleryButton.addEventListener('click', openGallery);
    }
    if(closeGalleryButton){
        closeGalleryButton.addEventListener('click', closeGallery);
    }
    window.addEventListener('keydown', (ev)=>{
        if(ev.key === 'Escape' && galleryPanel && galleryPanel.classList.contains('visible')){
            closeGallery();
        }
    });

    const galleryImages = document.querySelectorAll('.gallery-image');
    const photoModal = document.getElementById('photo-modal');
    const photoModalImg = document.getElementById('photo-modal-img');
    
    function openPhotoModal(imgSrc){
        if(!photoModal || !photoModalImg) return;
        photoModalImg.src = imgSrc;
        photoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closePhotoModal(){
        if(!photoModal) return;
        photoModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    galleryImages.forEach(img=>{
        img.addEventListener('click', (e)=>{
            const bgImage = window.getComputedStyle(img).backgroundImage;
            const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
            if(urlMatch && urlMatch[1]){
                openPhotoModal(urlMatch[1]);
            }
        });
    });
    
    if(photoModal){
        photoModal.addEventListener('click', (e)=>{
            if(e.target === photoModal || e.target === photoModalImg){
                closePhotoModal();
            }
        });
    }
    
    window.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape' && photoModal && photoModal.classList.contains('active')){
            closePhotoModal();
        }
    });

    const videoFolder = document.getElementById('video-folder');
    function openVideos(){
        window.location.href = 'project/videos/videos.html';
    }
    if(videoFolder){
        ['click','keypress'].forEach(evt=>{
            videoFolder.addEventListener(evt,(e)=>{
                if(evt === 'keypress' && e.key !== 'Enter') return;
                openVideos();
            });
        });
    }

    const loveLetterBtn = document.getElementById('love-letter-btn');
    if(loveLetterBtn){
        loveLetterBtn.addEventListener('click', ()=>{
            window.location.href = 'project/carta/carta.html';
        });
    }

})();