import dva from 'dva';
import './app.global.css';

// document.addEventListener('DOMContentLoaded', () => {
const dvaOpts = {};
const app = dva(dvaOpts);
app.router(require('./routes').default);
// app.use()
app.model(require('./models/system').default);

app.start('#root');
// })
