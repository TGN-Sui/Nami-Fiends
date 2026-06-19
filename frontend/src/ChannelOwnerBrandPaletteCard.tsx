import { useState, type ReactElement } from 'react';

type ChannelOwnerBrandPaletteCardProps = {
  palette: string[];
  onChangeColor: (index: number, color: string) => void;
  onReset: () => void;
};

export function ChannelOwnerBrandPaletteCard(props: ChannelOwnerBrandPaletteCardProps): ReactElement {
  const [expanded, setExpanded] = useState(true);

  return (
    <article className="panel channel-owner-tool-card channel-owner-brand-palette-card">
      <div className="channel-owner-tool-card-head">
        <div>
          <span className="mini-badge">Brand</span>
          <h3>Brand palette</h3>
          <p>Up to four approved colors for your game channel surfaces.</p>
        </div>
        <button
          className="profile-secondary-link"
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {expanded ? (
        <>
          <div className="channel-owner-brand-preview-row" aria-label="Approved brand color preview">
            {props.palette.slice(0, 4).map((color) => (
              <span className="channel-owner-brand-preview-dot" key={color} style={{ backgroundColor: color }} />
            ))}
          </div>

          <div className="channel-owner-brand-color-grid">
            {props.palette.slice(0, 4).map((color, index) => (
              <label className="channel-owner-brand-color-chip" key={index}>
                <span>Color {index + 1}</span>
                <span className="channel-owner-brand-color-swatch" style={{ backgroundColor: color }} />
                <input
                  aria-label={'Approved channel brand color ' + (index + 1)}
                  onChange={(event) => props.onChangeColor(index, event.target.value)}
                  type="color"
                  value={color}
                />
                <small>{color.toUpperCase()}</small>
              </label>
            ))}
          </div>

          <button className="profile-secondary-link" onClick={props.onReset} type="button">
            Reset palette
          </button>
        </>
      ) : null}
    </article>
  );
}