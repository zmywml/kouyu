export const lessons = [
  { id: 'airport', title: '在机场，从容出发', english: 'Ready for takeoff', category: '旅行沟通', level: 'A2', minutes: 12, icon: 'plane', color: 'sage', goal: '完成值机，说明行李情况，并礼貌选择座位。',
    lines: [['Good morning. May I see your passport, please?', '早上好，请出示您的护照。'], ['Sure. Here you are. I’m flying to London today.', '好的，给您。我今天要飞往伦敦。'], ['Do you have any bags to check in?', '您有行李需要托运吗？'], ['Yes, I have one suitcase.', '有的，我有一个行李箱。'], ['Would you like an aisle seat or a window seat?', '您想要靠过道还是靠窗的座位？'], ['A window seat, please. Thank you.', '请给我靠窗的座位，谢谢。']],
    words: [['passport', '/ˈpɑːspɔːt/', '护照'], ['check in', '/tʃek ɪn/', '办理登机；托运'], ['aisle seat', '/aɪl siːt/', '靠过道的座位'], ['suitcase', '/ˈsuːtkeɪs/', '行李箱']],
    prompts: ['Good morning! May I see your passport, please?', 'Thank you. Do you have any bags to check in?', 'Would you prefer a window seat or an aisle seat?'],
    intents: ['passport|here|sure', 'bag|suitcase|luggage|no|yes', 'window|aisle|seat'], hints: ['Sure. Here is my passport.', 'Yes, I have one suitcase.', 'A window seat, please.'], goals: ['出示护照', '说明行李情况', '选择座位'] },
  { id: 'campus', title: '认识一位新同学', english: 'A new connection', category: '校园生活', level: 'A2', minutes: 10, icon: 'coffee', color: 'peach', goal: '自然介绍自己，询问专业，并找到一个共同兴趣。',
    lines: [['Hi, I’m Alex. What’s your name?', '嗨，我是 Alex。你叫什么名字？'], ['I’m Lin. Nice to meet you.', '我是 Lin，很高兴认识你。'], ['What are you studying?', '你正在学习什么专业？'], ['I’m studying computer science.', '我在学计算机科学。'], ['What do you like doing in your free time?', '你空闲时喜欢做什么？'], ['I enjoy reading and playing basketball.', '我喜欢读书和打篮球。']],
    words: [['major', '/ˈmeɪdʒə/', '专业'], ['free time', '/friː taɪm/', '空闲时间'], ['enjoy', '/ɪnˈdʒɔɪ/', '喜欢'], ['introduce', '/ˌɪntrəˈdjuːs/', '介绍']],
    prompts: ['Hi, I’m Alex. What’s your name?', 'Nice to meet you! What are you studying?', 'What do you enjoy doing in your free time?'], intents: ['name|i am|i’m|i.m|call me', 'study|studying|major|science|english|art|business|engineering', 'like|enjoy|love|play|read'], hints: ['Hi! My name is Lin.', 'I’m studying computer science.', 'I enjoy reading and playing basketball.'], goals: ['介绍自己', '交流专业', '分享兴趣'] },
  { id: 'opinion', title: '让你的观点被听见', english: 'Make your point', category: '观点表达', level: 'B1', minutes: 15, icon: 'message', color: 'lavender', goal: '围绕小组学习表达观点，给出理由，并回应不同意见。',
    lines: [['Do you prefer studying alone or in a group?', '你更喜欢独自学习还是小组学习？'], ['I think studying in a group is more helpful.', '我认为小组学习更有帮助。'], ['Could you tell me why?', '你能告诉我原因吗？'], ['Because we can share ideas and learn from each other.', '因为我们可以分享想法、互相学习。'], ['But group work can be distracting.', '但是小组学习可能让人分心。'], ['That’s a good point. We could set a clear goal first.', '有道理。我们可以先设定一个明确的目标。']],
    words: [['in my opinion', '/əˈpɪnjən/', '在我看来'], ['share ideas', '/ʃeə aɪˈdɪəz/', '分享想法'], ['distracting', '/dɪˈstræktɪŋ/', '令人分心的'], ['clear goal', '/klɪə ɡəʊl/', '明确的目标']],
    prompts: ['Do you prefer studying alone or in a group?', 'Could you give me a reason for your preference?', 'Some people find group work distracting. What do you think?'], intents: ['think|prefer|opinion|group|alone', 'because|reason|share|help|focus', 'agree|point|but|however|could|understand'], hints: ['I prefer studying in a group.', 'Because we can share ideas.', 'That’s a good point, but we could set a clear goal.'], goals: ['表达观点', '说明理由', '回应不同意见'] },
];
export function createState() {return {version:2,diagnostic:null,activeLesson:'airport',progress:{},words:[],records:[],reviews:{},tasks:[{id:'starter',title:'旅行沟通 · 第一次口语练习',lesson:'airport',due:'',instruction:'完成精听、跟读和情景练习，提交一段你满意的录音。',group:'英语口语练习班',published:true,sample:true}]};}
export function loadState(raw) {try {const value=JSON.parse(raw);if(value?.version===2&&Array.isArray(value.tasks)&&Array.isArray(value.records)&&Array.isArray(value.words)&&value.progress&&value.reviews&&lessons.some(l=>l.id===value.activeLesson))return {...createState(),...value};}catch {}return createState();}
export function lessonProgress(state,id){const p=state.progress[id]||{};return ['listening','speaking','dialogue','review'].filter(key=>p[key]).length;}
export function recommendLesson(d){return d?.confidence==='comfortable'&&d?.answer==='window'?'opinion':d?.goal==='campus'?'campus':'airport';}
export function respondToDialogue(lesson,step,input){if(step>=lesson.prompts.length)return {done:true,step,text:'Thank you for the conversation. See you next time!'};if(!new RegExp(lesson.intents[step],'i').test(input))return {step,done:false,text:`Let’s try this part again. ${lesson.prompts[step]}`};const next=step+1;return {step:next,done:next===lesson.prompts.length,text:lesson.prompts[next]||'Great, we’ve covered everything. Thank you for the conversation!'};}
export function reducer(state,action){switch(action.type){
  case 'select':return {...state,activeLesson:action.id};
  case 'diagnose':return {...state,diagnostic:action.value,activeLesson:recommendLesson(action.value)};
  case 'progress':return {...state,progress:{...state.progress,[action.lesson]:{...state.progress[action.lesson],[action.step]:true}}};
  case 'word':return {...state,words:state.words.includes(action.word)?state.words.filter(w=>w!==action.word):[...state.words,action.word]};
  case 'record':return {...state,records:[action.record,...state.records]};
  case 'task':return {...state,tasks:[action.task,...state.tasks]};
  case 'submit':{const task=state.tasks.find(t=>t.id===action.task);return {...state,records:state.records.map(r=>r.id===action.id&&task?.published&&task.lesson===r.lesson?{...r,task:task.id,submitted:true}:r)};}
  case 'review':return {...state,reviews:{...state.reviews,[action.id]:action.review}};
  default:return state;
}}
