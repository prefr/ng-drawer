module.exports = function(grunt) {

	grunt.initConfig({

		pkg:		grunt.file.readJSON('package.json'),

		uglify: 	{
						options: 	{
										banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
									},
						build: 		{
		  								src: 'src/<%= pkg.name %>.js',
		  								dest: 'dist/<%= pkg.name %>.min.js'
						}
	  				},

	  	ngdocs:		{
	  					all:		['src/**/*.js']
	  				}
	})


	
	grunt.loadNpmTasks('grunt-contrib-uglify')
	grunt.loadNpmTasks('grunt-ngdocs')

	
	grunt.registerTask('default', ['uglify'])
}