import express from 'express'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as WebSocket from 'ws'
import * as http from 'http'

const config = JSON.parse(fs.readFileSync('./config.json'))
const port = config.server.port
const baseDir = config.server.baseDir
const supportedFileTypes = ['mp3', 'mp4']
const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

const collectFiles = (dir) => {
	const entries = fs.readdirSync(dir)
	const f = [], d = []
	
	if(entries && entries.length != -1) {
		entries.forEach(entry => {
			const path = (dir + '/' + entry)
			const stats = fs.statSync(path)
			
			if(stats.isFile()) {
				if(supportedFileTypes.indexOf(path.extname()) != -1) {
					f.push({name : entry, fullPath : path, isDirectory: false})
				}
			}
			else {
				d.push({name : entry, fullPath : path, isDirectory: true})
			}
		})
	}
	
	return {
		root: dir,
		files : f,
		directories : d
	}
}

app.use(function(req, resp, next) {
	console.log('received request: ' + (req.url + req.query) + ' from remote addr [' + req.ip + ']')
	resp.header('Access-Control-Allow-Origin', '*');
	resp.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.get('/weplay/list', (req, resp) => {
	const reqDir = req.query.dir
	let result;
	
	if(reqDir && fs.existsSync(reqDir)) {
		result = collectFiles(reqDir)
	}
	else {
		result = collectFiles(baseDir)
	}
	
	if(result) {
		resp.status(200).send(result)
	}
	else {
		resp.status(204).send()
	}
	
	resp.end()
})

app.get('/weplay/play', (req, resp) => {
	const reqFile = req.params.file
	
	if(fs.existsSync(reqFile)) {
		const stream = fs.createReadStream()
		
		stream.pipe(resp)
		
		stream.on('data', (data) => {
			resp.write(data)
		})
		
		stream.on('end', () => {
			resp.end();
		})
	}
	else {
		resp.status(404).send('File not found')
		resp.end()
	}
})

app.listen(port, () => console.log('WePlayer API server started and listening on: ' + port))
