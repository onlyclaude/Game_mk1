// 진입점: 화면 등록 후 시작 화면 표시
import { registerScreen, showScreen, toast } from './ui.js';
import * as game from './game.js';
import * as title from './screens/title.js';
import * as newGame from './screens/newGame.js';
import * as hub from './screens/hub.js';
import * as event from './screens/event.js';

registerScreen('title', title);
registerScreen('newGame', newGame);
registerScreen('hub', hub);
registerScreen('event', event);

window.addEventListener('error', (e) => toast('오류: ' + e.message, 'error', 4000));
window.addEventListener('unhandledrejection', (e) => toast('오류: ' + (e.reason?.message || e.reason), 'error', 4000));

game.init();
showScreen('title');
