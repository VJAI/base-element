import { BaseElement, element, ElementChanges, input, query } from './lib';

enum sizeRemMap {
  'small' = 1,
  'medium' = 2,
  'large' = 3,
}

enum smileyMap {
  'happy'= '😀',
  'lol' = '😂',
  'angel' = '😇',
  'hero' = '😎',
  'sad' = '😞',
  'cry' = '😢',
  'romantic' = '😍',
  'sleep' = '😴',
  'nerd' = '🤓'
}

@element('my-smiley', `<span></span>`)
class SmileyElement extends BaseElement {

  @input(true)
  type: 'happy' | 'sad' = 'happy';

  @input(true)
  size: 'small' | 'medium' | 'large' = 'medium';

  @query('span')
  spanEl;

  onChanges(changes: ElementChanges) {
    if (changes.has('type')) {
      this.updateHtml(smileyMap[this.type || 'happy'], this.spanEl);
    }

    if (changes.has('size')) {
      this.addStyle({ 'font-size': `${sizeRemMap[this.size]}rem`}, this.spanEl);
    }
  }
}

@element('my-app', `
  <my-smiley type="happy"></my-smiley>
  <my-smiley type="lol"></my-smiley>
  <my-smiley type="angel"></my-smiley>
  <my-smiley type="hero"></my-smiley>
  <my-smiley type="sad"></my-smiley>
  <my-smiley type="cry"></my-smiley>
  <my-smiley type="romantic"></my-smiley>
  <my-smiley type="sleep"></my-smiley>
  <my-smiley type="nerd"></my-smiley>
`)
class App extends BaseElement {
}

document.addEventListener('DOMContentLoaded', () => {
  const app = <SmileyElement>document.createElement('my-app');
  document.querySelector('.app-container').appendChild(app);
});