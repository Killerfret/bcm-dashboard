// Flashcards + Quiz logic
(function(){
  var fcData=null, fcDeck=null, fcIdx=0, fcFlipped=false;
  fetch('flashcards_data.json').then(function(r){return r.json();}).then(function(d){fcData=d; renderDeckPicker();});

  function clear(el){ while(el && el.firstChild) el.removeChild(el.firstChild); }

  function renderDeckPicker(){
    if(!fcData) return;
    var c = document.getElementById('fc-deck-picker'); if(!c) return;
    clear(c);
    Object.entries(fcData.decks).forEach(function(kv){
      var key=kv[0], deck=kv[1];
      var el = document.createElement('div');
      el.className='artifact'; el.style.cursor='pointer';
      var head = document.createElement('div'); head.className='art-head';
      var icon = document.createElement('span'); icon.className='art-icon'; icon.textContent='C';
      var meta = document.createElement('div');
      var h = document.createElement('h3'); h.textContent=deck.name;
      var p = document.createElement('p'); p.className='art-meta'; p.textContent=deck.cards.length+' kaarten';
      meta.appendChild(h); meta.appendChild(p);
      head.appendChild(icon); head.appendChild(meta);
      el.appendChild(head);
      el.onclick = function(){ startDeck(key); };
      c.appendChild(el);
    });
  }
  function startDeck(key){
    fcDeck=fcData.decks[key]; fcIdx=0; fcFlipped=false;
    document.getElementById('fc-deck-picker').style.display='none';
    document.getElementById('fc-player').style.display='block';
    renderCard();
  }
  function renderCard(){
    if(!fcDeck) return;
    var card = fcDeck.cards[fcIdx];
    document.getElementById('fc-counter').textContent = (fcIdx+1)+' / '+fcDeck.cards.length;
    var content = document.getElementById('fc-content');
    clear(content);
    if(!fcFlipped){
      var h2 = document.createElement('h2');
      h2.style.fontFamily='Fraunces,serif'; h2.style.color='#ffcc02'; h2.style.margin='0'; h2.style.fontSize='36px';
      h2.textContent = card.front;
      var hint = document.createElement('p');
      hint.style.color='#8a8a96'; hint.style.marginTop='20px'; hint.style.fontSize='13px';
      hint.textContent = 'klik om antwoord te zien';
      content.appendChild(h2); content.appendChild(hint);
    } else {
      var p1 = document.createElement('p');
      p1.style.fontSize='18px'; p1.style.lineHeight='1.6'; p1.style.margin='0';
      p1.textContent = card.back;
      content.appendChild(p1);
      if(card.analogie){
        var p2 = document.createElement('p');
        p2.style.marginTop='20px'; p2.style.color='#ffcc02'; p2.style.fontStyle='italic';
        p2.textContent = 'KEY: '+card.analogie;
        content.appendChild(p2);
      }
    }
  }
  function bind(id, fn){ var el=document.getElementById(id); if(el) el.onclick=fn; }
  bind('fc-card', function(){fcFlipped=!fcFlipped; renderCard();});
  bind('fc-flip', function(){fcFlipped=!fcFlipped; renderCard();});
  bind('fc-next', function(){if(fcDeck && fcIdx<fcDeck.cards.length-1){fcIdx++; fcFlipped=false; renderCard();}});
  bind('fc-prev', function(){if(fcDeck && fcIdx>0){fcIdx--; fcFlipped=false; renderCard();}});
  bind('fc-back', function(){
    document.getElementById('fc-deck-picker').style.display='grid';
    document.getElementById('fc-player').style.display='none';
  });
  document.addEventListener('keydown', function(e){
    var fcSec = document.getElementById('flashcards');
    if(!fcSec || !fcSec.classList.contains('active')) return;
    if(!fcDeck) return;
    if(e.code==='Space'){e.preventDefault(); fcFlipped=!fcFlipped; renderCard();}
    if(e.code==='ArrowRight' && fcIdx<fcDeck.cards.length-1){fcIdx++; fcFlipped=false; renderCard();}
    if(e.code==='ArrowLeft' && fcIdx>0){fcIdx--; fcFlipped=false; renderCard();}
  });

  var quizData=null, qAnswers={};
  fetch('quiz_data.json').then(function(r){return r.json();}).then(function(d){quizData=d; renderQuiz();});
  function renderQuiz(){
    if(!quizData) return;
    var container = document.getElementById('quiz-container'); if(!container) return;
    clear(container);
    quizData.questions.forEach(function(q, i){
      var div = document.createElement('div');
      div.style.cssText='background:#15151a;border:1px solid #2a2a35;padding:20px;margin-bottom:14px;border-radius:8px';
      var h3 = document.createElement('h3');
      h3.style.cssText='margin:0 0 14px;color:#fff;font-family:Fraunces,serif';
      h3.textContent = (i+1)+'. '+q.q;
      div.appendChild(h3);
      q.options.forEach(function(opt, oi){
        var btn = document.createElement('button');
        btn.textContent = opt;
        btn.style.cssText='display:block;width:100%;text-align:left;background:#1d1d24;border:1px solid #2a2a35;color:#ededf0;padding:12px 16px;margin:6px 0;border-radius:6px;cursor:pointer;font-family:inherit;font-size:14px';
        btn.onclick = function(){
          if(qAnswers[i]!==undefined) return;
          qAnswers[i] = oi;
          var correct = oi === q.correct;
          var btns = div.querySelectorAll('button');
          for(var bi=0; bi<btns.length; bi++){
            btns[bi].style.cursor='default';
            if(bi===q.correct){ btns[bi].style.background='rgba(52,211,153,.2)'; btns[bi].style.borderColor='#34d399'; btns[bi].style.color='#34d399'; }
            else if(bi===oi){ btns[bi].style.background='rgba(255,59,48,.2)'; btns[bi].style.borderColor='#ff3b30'; btns[bi].style.color='#ff3b30'; }
          }
          var exp = document.createElement('p');
          exp.style.cssText='margin-top:12px;padding:12px;background:#000;border-left:3px solid '+(correct?'#34d399':'#ff3b30')+';color:#ddd;font-style:italic';
          exp.textContent = (correct?'OK: ':'FOUT: ')+q.explain;
          div.appendChild(exp);
          updateQuizStats();
        };
        div.appendChild(btn);
      });
      container.appendChild(div);
    });
    updateQuizStats();
  }
  function updateQuizStats(){
    var right=0, wrong=0;
    Object.entries(qAnswers).forEach(function(kv){
      var qi=kv[0], ai=kv[1];
      if(quizData.questions[qi].correct === ai) right++;
      else wrong++;
    });
    var sR=document.getElementById('q-right'); if(sR) sR.textContent=right;
    var sW=document.getElementById('q-wrong'); if(sW) sW.textContent=wrong;
    var sS=document.getElementById('q-score'); if(sS) sS.textContent=(right*10)+' pt';
    var sP=document.getElementById('q-progress'); if(sP) sP.textContent=(right+wrong)+'/'+(quizData?quizData.questions.length:30);
  }
  bind('q-reset', function(){qAnswers={}; renderQuiz();});
})();
