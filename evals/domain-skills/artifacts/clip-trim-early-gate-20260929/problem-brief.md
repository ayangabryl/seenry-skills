# Brief and direction

Audience: a creator selecting a usable excerpt from a sample video in a fictional editing tool, Framefield. Object: one 19.2-second illustrated sample clip. Decision: adjust in and out points while immediately seeing the kept interval and duration. The trim is local state; there is no export or save claim.

Default in/out: 2.4/15.6 seconds. Minimum selected duration: 1.5 seconds. The full duration and initial values are fictional sample data. Start and end handles accept pointer, touch and keyboard input. Reset restores the initial edit and is disabled when there is nothing to reset.

The decisive region is the visible filmstrip and its selected interval, paired with the duration and in/out readout. A dark editor surface keeps the footage legible. The amber perimeter and grips are working controls rather than decoration. The preview shows the frame at the current in point, which makes changing the start meaningful even without playback.

Motion contract: pointer movement owns trim state directly; the timeline and readouts update in the same event. The filmstrip stays fixed. Handle hover/focus changes only its affordance. Pointer cancellation leaves the last valid value. Reversal updates from current state. Reduced motion removes cosmetic transitions while preserving all changes. No operation or asynchronous status is simulated.

Research transfer: Airbnb duration dial visually ties a changed extent to a stable numeric duration; Opal timer slider keeps value visible while changing. These are interaction principles, not a copied treatment. This original component uses a linear filmstrip because video editors need temporal frames and two endpoints.
