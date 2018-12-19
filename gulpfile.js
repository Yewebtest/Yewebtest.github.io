var gulp = require('gulp');
var sass = require('gulp-sass');
var stylus = require('gulp-stylus');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var autoprefixer = require('gulp-autoprefixer');
var pxtorem = require('gulp-pxtorem');
var crypto = require('crypto');
var fs = require('fs');
var getPixels = require("get-pixels") 
var sourcemaps  = require('gulp-sourcemaps');
const { exec } = require('child_process');
const iconv = require('iconv-lite');

const config={
    img:["img","images"]
}

gulp.task('serve', function() {
	browserSync.init({
		server: "./"
	});
});

gulp.task('watch', function() {
    gulp.watch("./css/*.scss",['sass']);
    gulp.watch("./css/*.styl",['stylus']);
    gulp.watch("./*.html").on('change', reload);
    gulp.watch("./js/*.js").on('change', reload);
    gulp.watch("./css/*.css").on('change', reload);
})

gulp.task('sass', function(){
  return gulp.src('./css/*.scss')
    .pipe(sass({outputStyle:'compact'}).on('error', sass.logError))
    .pipe(gulp.dest('./css'))
});

gulp.task('stylus', function () {
    return gulp.src(['./css/style.styl','./css/mobMedia.styl','./css/sjj.styl'])
    .pipe(sourcemaps.init())
    .pipe(stylus({compress: false}))

    .on('error', swallowError)

    .pipe(autoprefixer({
        browsers: ['last 20 versions'],
        cascade: true,
        remove: false,
    }))

    .on('error', swallowError)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./css'))
});

gulp.task('default', ['serve','watch']);


var ImgPath=''
var fileTwo='';

var img=config.img;

img.forEach(function(v){
    var path=__dirname+"\\"+v+"\\"
    fs.exists(path,function(exists){
        if(exists){
            ImgPath=path
            watch()
            return
        }else{
            console.log(path+'not exists')
        }
    })
})

function swallowError(error) {
    console.error(error.toString())
    this.emit('end')
}

function watch(){
    fs.watch(ImgPath,function(event, filename){
        if(event=='change'){
            if (filename.indexOf('_tmp')==-1 && filename.indexOf('crdownload')==-1) {
                if (fileTwo==''){
                    fileTwo=filename
                    var rs = fs.createReadStream(ImgPath+filename);
                    var hash = crypto.createHash('md5');
                    rs.on('data', hash.update.bind(hash));
                    rs.on('end', function() {
                        newFilename=hash.digest('hex');
                        getImgInfo(ImgPath+filename,newFilename.substring(0,5));
                    });
                }
            }
        }
    })
}

function rename(filename,newFilename){
    var patt=new RegExp(/\w{36,}/);
    var result=patt.test(filename)
    if(!result){
        fs.rename(filename,newFilename,function(err){
            if(err){
                console.log(filename+" => file rename fail");
                return
            }
            var source=filename.match(/(?:[^\\]+)(?:\.[^\(]+)/i);
            console.log('\nSourceName => '+source[0]);
            console.log('NewName => '+newFilename.match(/\w{36,}\.(?:jpg|png)$/i));
            GetSize(newFilename);
        })
    }
}

function getImgInfo(filename,newName){ 
    getPixels(filename, function(err, pixels) {
        if(err) {
            console.log(filename+" => not image");
            return
        }
        info = "_"+pixels.shape[0]+'x'+pixels.shape[1]

        var newName1=filename.replace(/([^\\]+)(\.[^\(]+)/i,newName)+info+filename.match(/\.\w+$/)

        rename(filename,newName1);
        exec('clip').stdin.end(iconv.encode(newName+info+filename.match(/\.\w+$/), 'gbk'));
    })
    
}

function GetSize(filename){ 
    fs.stat(filename,function(err,state){
        if(err){
            console.log(err.message)
            return
        }
        var size=state.size/1024
        console.log('FileSize => '+size.toFixed(1)+' KB')
        fileTwo=''
    })
}
