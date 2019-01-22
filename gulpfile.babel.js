'use strict'

import gulp from 'gulp'
import babel from 'gulp-babel'
import eslint from 'gulp-eslint'
import sourcemaps from 'gulp-sourcemaps'
import uglify from 'gulp-uglify'
import rename from 'gulp-rename'
import {spawn} from 'child_process'
import del from 'del'

const target = './target'

gulp.task('clean', () => {
	return del([target])
})

gulp.task('build', gulp.series('clean', () => {
	return gulp.src('./src/index.js')
			   .pipe(sourcemaps.init())
	           .pipe(eslint())
	           .pipe(eslint.format())
	           .pipe(eslint.failAfterError())
	           .pipe(babel({presets: ['@babel/preset-env']}))
	           .pipe(uglify())
	           .pipe(sourcemaps.write())
	           .pipe(rename('./server.js'))
	           .pipe(gulp.dest(target))
}))

gulp.task('run', gulp.series('build', () => {
	let node = false,
	    onShutdown = (code, sig) => {
			if(node) {
				console.log('Server instance is shutting down [' + code + ',' + sig + ']')
				node.kill()
			}
		}
		
	node = spawn('node', [__dirname + '/target/server.js'], {stdio: 'inherit'})
	
	node.on('close', (code, sig) => {
		onShutdown(code, sig)
	})	
	
	node.on('exit', (code, sig) => {
		onShutdown(code, sig)
	})
}))

// Run everything
gulp.task('default', gulp.series('run'))
