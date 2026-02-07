import 'dotenv/config'

const url = 'http://localhost:' + (process.env.PORT || 8080) + '/subscriptions/create'

const payload = {
  marmorariaId: 1,
  planoId: 1,
  months: 1,
}

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})

console.log('status:', res.status)
const txt = await res.text()
console.log(txt)
