# How an ATM gives you cash in 10 seconds

Structure follows the concept: 5 real steps.
Card & chip → PIN check → bank network → your bank says yes → cash out.
Theme: an ATM receipt. A receipt prints down at the end of each step and tears off to open the next.
Running joke: the 2-second pause before "Please collect your cash".
Voice: Kokoro `af_heart`. Host: the simple girl host. All visuals come from `lib/atm.js` (asset sheets 1–3).

## Step 1 · Card & chip
You walk into the ATM. The guard is asleep. The AC is on full blast. You put in your card, and ten seconds later, money comes out of a wall. But in those ten seconds, your card, a tiny computer, two banks, and a network you've never heard of, all hold a quick meeting. Oh, and at the very end, there's a two second pause that stops every heart in India. Let's start with the card. That gold square is not decoration. It's a tiny computer. The old magnetic stripe shouts the same details every single time, so crooks could copy it. The chip makes a brand new secret code for every transaction. Copy it, and it's already useless. Card read. Next, the PIN.

## Step 2 · PIN check
You type your PIN. And you cover the keypad with your other hand, like it's an exam paper. Good. But here's the twist. Your PIN never travels as four numbers. The keypad has its own little security chip. The moment you press enter, it scrambles your PIN into a coded block that looks like gibberish. If someone tries to open the keypad to peek, it wipes its own keys. Only your bank can unscramble that block. Not the ATM. Not the guard. Definitely not the guard. He's asleep.

## Step 3 · Bank network
Now the ATM sends a message: card ending four eight two one wants two thousand rupees. But what if this ATM belongs to a different bank? It doesn't know you at all. So it calls a switch. In India, that's the National Financial Switch, run by NPCI. It connects over thirteen hundred banks and about two and a half lakh ATMs. The switch reads your card number, finds out which bank you belong to, and forwards the message there. All in under a second. And for this little favour, your bank pays the ATM's bank a fee called interchange. Nineteen rupees per withdrawal.

## Step 4 · Your bank says yes
Your bank unscrambles the PIN, and checks the chip's secret code. Then three quick questions. Enough balance? Under the daily limit? Card not blocked? Three yeses. Approved. Your bank holds two thousand rupees, and the reply races back, through the switch, to the ATM. Your phone buzzes: two thousand rupees debited. The money has left your account. It just hasn't left the machine yet.

## Step 5 · Cash out
Now the ATM opens its safe. Inside are cassettes stacked with notes. Five hundreds, two hundreds, one hundreds. Rollers pick the notes one by one. A sensor checks every note, so two stuck together don't sneak out. Any doubtful note goes straight into the reject bin. The notes are stacked. The shutter thinks about it. And then: please collect your cash. That pause? Every heart in India stops. And if the cash never comes out, but your account is debited, RBI rules say your bank must return it within five days, or pay you a hundred rupees for every day of delay. Card back. Cash out. Receipt printed. Ten seconds. Done.
