import { BaseElement, element, ElementChanges, input, query } from './lib';

@element('my-smiley', `<span></span>`)
class SmileyElement extends BaseElement {

  @input()
  type: 'happy' | 'sad' = 'happy';

  @input()
  size: 'small' | 'medium' | 'large' = 'medium';

  @query('span')
  spanEl;

  onChanges(changes: ElementChanges) {
    if (changes.has('type')) {
      this.updateHtml(this.type === 'happy' ? '😊' : '😞', this.spanEl);
    }

    if (changes.has('size')) {
      this.clearClasses(this.spanEl)
        .addClass(this.size, this.spanEl);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const smiley = document.createElement('my-smiley');
  document.body.appendChild(smiley);
});