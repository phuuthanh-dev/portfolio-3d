import './App.css';
import portfolio from './portfolio.config.json';
import Desktop from './components/os/Desktop';

function App() {
    document.title = `${portfolio.profile.name} - Portfolio`;
    return (
        <div className="App">
            <Desktop />
        </div>
    );
}

export default App;
