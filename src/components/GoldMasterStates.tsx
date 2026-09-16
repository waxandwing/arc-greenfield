import { GoldMasterGallery } from './GoldMasterGallery'

export function GoldMasterWeekEdit() {
  return <div className="gm-overlay-host">
    <GoldMasterGallery />
    <section className="gm-inline-create" role="dialog" aria-label="Add lesson">
      <small>WED · 2D ART</small>
      <label>What are you teaching?<input autoFocus defaultValue="Gallery Walk" /></label>
      <div className="gm-inline-options"><button>2D Art · P2</button><button>Unit 2</button><button>1:30 PM</button><button>More details</button></div>
      <div className="gm-inline-actions"><span>Enter to add · Esc to cancel</span><button>Cancel</button><button className="gm-new">Add lesson</button></div>
    </section>
  </div>
}

export function GoldMasterShiftPreview() {
  return <div className="gm-shift-page">
    <div className="gm-shift-underlay"><GoldMasterGallery /></div>
    <div className="gm-shift-scrim"/>
    <section className="gm-shift-panel" role="dialog" aria-label="Shift consequence preview">
      <header><div><small>SHIFT · WEDNESDAY AFTERNOON</small><h1>Move these lessons forward one instructional day?</h1><p>Thursday is instructional. Friday's Unit Quiz stays fixed.</p></div><button>×</button></header>
      <div className="gm-shift-scope"><b>Changing Wednesday afternoon</b><span>3 lessons · all visible classes</span></div>
      <div className="gm-shift-columns"><div><h3>MOVES</h3><article><i className="gm-coral"/><div><b>Comparative Analysis</b><span>AP Art History · Wed 12:30 → Thu 12:30</span></div></article><article><i className="gm-mustard"/><div><b>Gallery Walk</b><span>2D Art · Wed 1:30 → Thu 1:30</span></div></article><article><i className="gm-blue"/><div><b>Studio Work Time</b><span>3D Art · Wed 2:30 → Thu 2:30</span></div></article></div><div><h3>STAYS FIXED</h3><article className="gm-fixed-card"><i/><div><b>Unit Quiz</b><span>AP Art History · Friday 12:30</span><small>Fixed assessment</small></div></article></div></div>
      <div className="gm-shift-warning"><b>What happens next</b><p>Thursday's flexible lessons move forward with the sequence. Nothing is overwritten. Taught history does not move.</p></div>
      <footer><button>Cancel</button><button>Move only selected</button><button className="gm-new">Apply shift</button></footer>
    </section>
  </div>
}
