import logo from './logo.svg';
import Hello from './Hello';
import Counter from './Counter';
import Form from './Form';
import './App.css';
import ConditionalRendering from './ConditionalRendering';
import ItemList from './ItemList';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
          yahoo!
        </p>
        <Hello name="React Developer" message="This is a message passed via props!"/>
        <Hello name="John Doe" message="Learning React step by step."/>
        <Hello name="Jane Smith" message="Props make components dynamic!"/>
        <Counter />
        <Form />
        <ConditionalRendering />
        <ItemList />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
