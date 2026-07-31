import fs from 'fs'

const path = 'D:/Hoang_Web/workspace/ScadaWeb/src/assets/icons/device.svg'
let s = fs.readFileSync(path, 'utf8')
s = s.replace(/\s+class="device-fill"/g, '')
s = s.replace(/<path (?=[^>]*fill="#FFFF13")/g, '<path class="device-fill" ')
fs.writeFileSync(path, s)
console.log('tagged', (s.match(/class="device-fill"/g) || []).length)
