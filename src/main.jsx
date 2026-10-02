import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowRight, AudioLines, Award, BarChart3, Bell, BookOpen,
  Check, ChevronRight, CircleUserRound, Clock3, Headphones, Languages,
  LayoutDashboard, Library, Lock, Menu, MessageCircleMore, Mic2, Pause,
  Play, Search, Settings, Sparkles, Target, UsersRound, Volume2, X
} from 'lucide-react';
import './styles.css';

const modules = [
  { id: 'dashboard', label: '今日学习', icon: LayoutDashboard },
  { id: 'path', label: '学习路径', icon: Target },
  { id: 'listening', label: '精听训练', icon: Headphones },
  { id: 'speaking', label: '跟读纠音', icon: Mic2 },
  { id: 'dialogue', label: '情景对话', icon: MessageCircleMore },
  { id: 'classroom', label: '我的课堂', icon: UsersRound },
];

const lessons = [
  { level: 'A2', title: '机场办理登机', meta: '旅行 · 8 分钟', progress: 72, icon: '✈️', color: 'mint' },
  { level: 'B1', title: '表达并支持观点', meta: '讨论 · 12 分钟', progress: 35, icon: '💬', color: 'blue' },
  { level: 'B1', title: '项目进度汇报', meta: '职场 · 15 分钟', progress: 0, icon: '📊', color: 'amber' },
];

const skills = [
  ['发音清晰度', 82, '#286e5a'], ['流利度', 68, '#4c7f70'], ['词汇与句型', 74, '#688fb8'],
  ['听力理解', 79, '#d29b48'], ['语法准确性', 65, '#bd6e5d'], ['对话完成度', 76, '#8070a5']
];

function Sidebar({ active, onChange, open, close }) {
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="brand"><span className="brand-mark"><AudioLines size={22}/></span><span>口语</span></div>
    <button className="mobile-close" onClick={close} aria-label="关闭菜单"><X/></button>
    <nav>{modules.map(({id,label,icon:Icon}) => <button key={id} className={active===id?'active':''} onClick={()=>{onChange(id);close();}}><Icon size={19}/><span>{label}</span>{id==='dialogue'&&<b>AI</b>}</button>)}</nav>
    <div className="sidebar-foot">
      <div className="week-goal"><div><Award size={18}/><strong>本周目标</strong></div><p>已学习 3 / 5 天</p><span><i style={{width:'60%'}}/></span></div>
      <button><Settings size={18}/>设置</button>
      <div className="profile"><div className="avatar">林</div><div><strong>林同学</strong><small>B1 · 坚持 12 天</small></div><ChevronRight size={16}/></div>
    </div>
  </aside>
}

function Header({ title, openMenu }) {
  return <header><button className="menu-btn" onClick={openMenu}><Menu/></button><div><small>2026 年 10 月 2 日 · 星期五</small><h1>{title}</h1></div><div className="header-actions"><button aria-label="搜索"><Search/></button><button aria-label="通知" className="notification"><Bell/><i/></button><div className="avatar">林</div></div></header>
}

function SkillRing() {
  return <div className="skill-panel card"><div className="card-head"><div><span className="eyebrow">能力画像</span><h2>你的口语正在稳定进步</h2></div><button>查看报告 <ArrowRight size={15}/></button></div><div className="skills-layout"><div className="score-ring"><div><strong>74</strong><small>综合能力</small></div></div><div className="skill-bars">{skills.map(([name,val,color])=><div key={name}><label><span>{name}</span><b>{val}</b></label><i><em style={{width:`${val}%`,background:color}}/></i></div>)}</div></div></div>
}

function Dashboard({ navigate }) {
  const [playing,setPlaying]=useState(false);
  return <>
    <section className="hero"><div><span className="eyebrow light">今日推荐 · 12 分钟</span><h2>开口表达，从真实场景开始</h2><p>完成「表达并支持观点」，练习组织观点与自然衔接。</p><button onClick={()=>navigate('dialogue')}><Play size={17} fill="currentColor"/>开始练习</button></div><div className="hero-art"><span>Hi!</span><span>Tell me more.</span><div className="sound-wave">{[1,2,3,4,5,6,7,8,9].map(x=><i key={x}/>)}</div></div></section>
    <section className="quick-stats"><div><FlameIcon/><span><strong>12 天</strong><small>连续学习</small></span></div><div><Clock3/><span><strong>38 分钟</strong><small>本周练习</small></span></div><div><Mic2/><span><strong>126 句</strong><small>累计开口</small></span></div><div><Sparkles/><span><strong>+6</strong><small>本月提升</small></span></div></section>
    <div className="dashboard-grid"><SkillRing/><div className="today card"><div className="card-head"><div><span className="eyebrow">继续学习</span><h2>机场广播精听</h2></div><span className="tag">A2</span></div><div className="audio-player"><button onClick={()=>setPlaying(!playing)}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button><div><div className={`wave ${playing?'moving':''}`}>{[12,25,18,35,22,31,16,39,27,18,32,14,28,36,20,27,15,33,22,38,18,25,31,16].map((h,i)=><i key={i} style={{height:h}}/>)}</div><label><span>01:24</span><span>03:10</span></label></div></div><p className="transcript"><b>“Attention passengers on flight CA986...”</b><span>请搭乘 CA986 航班的旅客注意……</span></p><div className="lesson-actions"><button onClick={()=>navigate('listening')}><BookOpen size={16}/>进入精听</button><button><Languages size={16}/>生词 8</button></div></div></div>
    <section className="lesson-section"><div className="section-title"><div><span className="eyebrow">为你规划</span><h2>下一步学习</h2></div><button onClick={()=>navigate('path')}>完整路径 <ArrowRight size={16}/></button></div><div className="lesson-list">{lessons.map((l,i)=><article key={l.title} onClick={()=>navigate(i===0?'listening':i===1?'dialogue':'speaking')}><div className={`lesson-icon ${l.color}`}>{l.icon}</div><div className="lesson-info"><span>{l.level}</span><h3>{l.title}</h3><p>{l.meta}</p></div><div className="lesson-progress"><strong>{l.progress?`${l.progress}%`:'未开始'}</strong><i><em style={{width:`${l.progress}%`}}/></i></div><ChevronRight/></article>)}</div></section>
  </>
}

function LearningPath({navigate}) {
  const stages=[['已完成','基础诊断','了解当前口语能力','done'],['进行中','旅行沟通','机场、酒店与问路','current'],['待解锁','观点表达','组织观点与回应他人','locked'],['待解锁','项目汇报','清晰呈现进度与结论','locked']];
  return <div className="subpage"><div className="intro"><span className="eyebrow">个性化学习路径</span><h2>从能开口，到会交流</h2><p>基于你的诊断结果，重点提升流利度和语法准确性。</p></div><div className="path-board">{stages.map(([status,title,desc,state],i)=><div className={`path-node ${state}`} key={title}><div className="node-line"/><div className="node-index">{state==='done'?<Check/>:state==='locked'?<Lock/>:i+1}</div><article><span>{status}</span><h3>{title}</h3><p>{desc}</p>{state==='current'&&<button onClick={()=>navigate('listening')}>继续学习 <ArrowRight size={16}/></button>}</article></div>)}</div></div>
}

function Listening() {
  const [playing,setPlaying]=useState(false); const [line,setLine]=useState(1); const [speed,setSpeed]=useState(1);
  const transcript=[['Good morning. May I see your passport, please?','早上好。请出示您的护照。'],['Sure. Here you are. I’m flying to London today.','好的，给您。我今天要飞往伦敦。'],['Would you like an aisle seat or a window seat?','您想要靠过道还是靠窗的座位？'],['A window seat, please.','请给我靠窗的座位。']];
  return <div className="practice-layout"><section className="practice-main card"><div className="media-placeholder"><div><Headphones/><span>Airport check-in</span></div><button onClick={()=>setPlaying(!playing)}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button></div><div className="player-row"><button onClick={()=>setPlaying(!playing)}>{playing?<Pause/>:<Play/>}</button><div className="timeline"><i><em style={{width:'38%'}}/></i><span>01:12 / 03:10</span></div><button onClick={()=>setSpeed(speed===1?0.75:speed===0.75?1.25:1)}>{speed}×</button><button><Volume2/></button></div><div className="transcript-list">{transcript.map((t,i)=><button key={i} className={line===i?'selected':''} onClick={()=>line===i?setLine(-1):setLine(i)}><span>{String(i+1).padStart(2,'0')}</span><p><strong>{t[0]}</strong>{line===i&&<small>{t[1]}</small>}</p><Volume2 size={18}/></button>)}</div></section><aside className="practice-aside card"><span className="eyebrow">本课目标</span><h2>办理登机</h2><p>听懂常见机场问答，并能使用礼貌表达完成值机。</p><h3>核心词汇</h3><div className="chips"><span>passport</span><span>aisle seat</span><span>boarding pass</span><span>window seat</span></div><button className="primary"><Check/>完成精听</button></aside></div>
}

function Speaking() {
  const [recording,setRecording]=useState(false); const [result,setResult]=useState(false);
  const toggle=()=>{if(recording){setRecording(false);setResult(true)}else{setResult(false);setRecording(true)}};
  return <div className="speaking-page"><div className="speaking-card card"><span className="eyebrow">跟读纠音 · 3 / 8</span><h2>Would you like an aisle seat or a window seat?</h2><p>您想要靠过道还是靠窗的座位？</p><button className="listen-btn"><Volume2/>播放原音</button><div className={`recorder ${recording?'recording':''}`}><button onClick={toggle}><Mic2/></button><strong>{recording?'正在聆听…':result?'录音完成':'按下开始跟读'}</strong><small>{recording?'再次点击结束录音':'请在安静环境中练习'}</small></div>{result&&<div className="feedback"><div className="feedback-score"><strong>82</strong><span>本次得分</span></div><div><h3>表达清晰，注意语调</h3><p><b>aisle</b> 的开头元音可以更饱满；选择问句的前半句升调、后半句降调。</p><button onClick={()=>{setResult(false);setRecording(true)}}>再练一次</button></div></div>}</div></div>
}

function Dialogue() {
  const [messages,setMessages]=useState([{who:'ai',text:'Hi! You’re checking in for your flight to London. May I see your passport, please?'},{who:'me',text:'Sure. Here you are.'},{who:'ai',text:'Thank you. Do you have any bags to check in?'}]);
  const [thinking,setThinking]=useState(false);
  const reply=()=>{if(thinking)return;setThinking(true);setTimeout(()=>{setMessages(m=>[...m,{who:'me',text:'Yes, I have one suitcase.'},{who:'ai',text:'Great. Please place it on the scale. Would you prefer a window or aisle seat?'}]);setThinking(false)},700)};
  return <div className="dialogue-page"><section className="scenario-panel"><span className="eyebrow">AI 情景对话</span><h2>在机场办理登机</h2><p>你是准备飞往伦敦的旅客，与地勤人员完成值机。</p><div><label>语言目标</label><span>礼貌提出需求</span><span>回答行李问题</span><span>选择座位</span></div><div className="scenario-progress"><label>任务进度 <b>2 / 4</b></label><i><em style={{width:'50%'}}/></i></div></section><section className="chat-panel card"><div className="chat-head"><div className="ai-avatar"><Sparkles/></div><div><strong>机场地勤</strong><small><i/>AI 正在对话</small></div><button>结束练习</button></div><div className="messages">{messages.map((m,i)=><div key={i} className={m.who}><span>{m.who==='ai'?'AI':'我'}</span><p>{m.text}</p></div>)}{thinking&&<div className="ai"><span>AI</span><p className="typing"><i/><i/><i/></p></div>}</div><div className="chat-input"><button className="hint"><Sparkles/>给我提示</button><button className="mic" onClick={reply}><Mic2/></button><small>点击麦克风回答</small></div></section></div>
}

function Classroom() {
  const students=[['陈晨','流利度提升明显','84','+8'],['周然','需关注 /θ/ 发音','71','+2'],['宋一','连续练习 7 天','79','+6'],['何嘉','本周未完成任务','68','-1']];
  return <div className="classroom-page"><div className="teacher-banner"><div><span className="eyebrow light">教师课堂</span><h2>2025 级英语口语 2 班</h2><p>32 名学生 · 本周任务完成率 78%</p></div><button><UsersRound/>发起课堂活动</button></div><div className="class-grid"><section className="card"><div className="card-head"><div><span className="eyebrow">班级动态</span><h2>学生学习概览</h2></div><button>查看全部</button></div><div className="student-list">{students.map(s=><div key={s[0]}><span className="student-avatar">{s[0][0]}</span><p><strong>{s[0]}</strong><small>{s[1]}</small></p><b>{s[2]}<small className={s[3][0]==='-'?'down':''}>{s[3]}</small></b></div>)}</div></section><section className="card assignment"><span className="eyebrow">待批阅</span><h2>观点表达录音</h2><div className="assignment-number">18<small>/ 32 人已提交</small></div><i><em style={{width:'56%'}}/></i><button>进入批阅 <ArrowRight/></button></section></div></div>
}

function FlameIcon(){return <div className="flame">🔥</div>}

const titles={dashboard:'今日学习',path:'学习路径',listening:'精听训练',speaking:'跟读纠音',dialogue:'情景对话',classroom:'我的课堂'};
function App(){const [active,setActive]=useState('dashboard');const [menu,setMenu]=useState(false);const content=useMemo(()=>({dashboard:<Dashboard navigate={setActive}/>,path:<LearningPath navigate={setActive}/>,listening:<Listening/>,speaking:<Speaking/>,dialogue:<Dialogue/>,classroom:<Classroom/>})[active],[active]);return <div className="app"><Sidebar active={active} onChange={setActive} open={menu} close={()=>setMenu(false)}/>{menu&&<div className="scrim" onClick={()=>setMenu(false)}/>}<main><Header title={titles[active]} openMenu={()=>setMenu(true)}/><div className="content">{content}</div></main></div>}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
