//var $ = jquery.noConflict();
var Blackbox = {
	post_id:null,
	static_root:'http://localhost:8000/',
	initialized:false,
	debug:true,
	type: undefined,
	sID: null,
	playing: false,
	track_loaded:false,
	track_artist: null,
	track_title: null,
	via: undefined,
	media_url: undefined,
	media_id: null,
	post_url: undefined,
	track_length: null,
	track_pos: null,
	playlistPosition:0,
	playlist:new Array(),
	log: function(message) {
		if (Blackbox.debug) { console.log('Blackbox: ', message); }
	},
	init: function(track, args) {
		
		
		
		$('#player').animate({
			left: '0',
		}, 1000, function() {
		// Animation complete.
			// Animate Controls
			
			$('#player #scrubber').animate({
				left: '0px'
				}, 500, function() {
					$('#player #controls').animate({
						left: '0px'
						}, 500, function() {
								
					});				
			});
			

			

			
			// Animate Scrubber			

			
			//$('#player #title').css('color','#000');
		
		});
		
		Blackbox.initialized = true;
		Blackbox.play(track, args);
	},
	play: function(track_id_or_link, args) {
		if (Blackbox.initialized) {
			$('#player #title').html('Loading...');
			$('#player #controls #play-pause').addClass('playing');
			
			var error = false;
		
			// Stop all currently playing sounds
			Blackbox.stop();
		
			// Update with track info
			Blackbox.update(args);	
			Blackbox.media_url = track_id_or_link;
		
			if (this.type == "mp3") {
			
				Blackbox.setTrackLinks();
			
				if (Blackbox.debug) { console.log('track-link: ', this.track_source_url); }
				
				var link = track_id_or_link;
			
				if (Blackbox.debug) { console.log('Creating Sound: ', link); }
				
				// Check if we already have a Sound Manager instance
				if (soundManager.getSoundById('mp3-player')) {
					if (soundManager.getSoundById('mp3-player').url != link) {
						soundManager.getSoundById('mp3-player').load({ url: link });
						soundManager.getSoundById('mp3-player').play();
					} else {
						soundManager.getSoundById('mp3-player').play();
					}
				} else {
				// If not Sound Manager instance, create one
					soundManager.createSound({
						debugMode:false,
						id:'mp3-player',
						url: link,
						autoPlay: true,
						onplay: function() { 
							Blackbox.sID = this.sID; 
							Blackbox.playing = true; 
							
							// Display 'highlighted' play button
							$('#player #controls #play-pause').addClass('playing');
						},
						whileplaying: function() { Blackbox.whileplayingHandler(); },
						onpause: function() { Blackbox.onpauseHandler(); },
						onresume: function() { Blackbox.onresumeHandler(); },
						onfinish: function() {
							Listunes.onFinish();
						},
						volume:50
					});
				}
				//this.sID = this.soundObj.sID;
				// Play
				//this.soundObj.play(this.soundObj.sID);
		
			} 
		
			if (this.type == "soundcloud" || this.type == "sc") {
				Blackbox.setTrackLinks();
				var track_id = track_id_or_link;
				// Listunes is already providing the track id, no need for this
				// unless we're in stand-alone
				//var track_id = this.getSoundcloudTrackID(track_id_or_link);
		
				if (Blackbox.debug) { console.log('Playing: ', track_id); }
		
				SC.whenStreamingReady(function() {
			
					this.soundObj = SC.stream(track_id, 
					{ 
						debugMode:false,
						onplay: function() { Blackbox.sID = this.sID; },  
						whileplaying: function() { Blackbox.whileplayingHandler(); },
						onpause: function() { Blackbox.onpauseHandler(); },
						onresume: function() { Blackbox.onresumeHandler(); },
						volume:50
					});
					
					console.log('Sound Object: ',this.soundObj);
		
					if (Blackbox.debug) { console.log('SC ID: ', this.soundObj.sID); }
			
					// Play -- keep this inside the whenStreamingReady method
					this.soundObj.play(this.soundObj.sID);
					this.soundObj.whileplaying = Blackbox.updatePlayer();
				});
			}
		
			if (!error) {
				//this.soundObj.whileplaying = this.updatePlayer();
			} else if (Blackbox.debug) { console.log('ERROR: Error flag raised in play() method'); }
		} else {
			Blackbox.init(track_id_or_link, args);
		}
	},
	onpauseHandler: function() {
		Blackbox.playing = false; 
		$('#player #controls #play-pause').removeClass('playing');
		//$('#player #scrubber #progress').removeClass('active');
	},
	onresumeHandler: function() {
		$('#player #controls #play-pause').addClass('playing');
		//$('#player #scrubber #progress').addClass('active');
	},
	whileplayingHandler: function() {
		Blackbox.updatePlayer(); 
		Blackbox.playing = true; 
		$('#player #controls #play-pause').addClass('playing');
		//$('#player #scrubber #progress').addClass('active');
	},
	pause: function() {
		soundManager.togglePause(Blackbox.sID);
	},
	stop: function() {
		soundManager.stopAll();
		Blackbox.playing = false;
	},
	volume: function(val) {
		if (typeof val == "undefined") {
			// If no volume specified, return current volume value
			return Blackbox.soundObj().volume;
		} else {
			// Set volume == val
			this.log('Volume set to ' + val);
			Blackbox.soundObj().setVolume(val);
		}
	},
	nextTrack: function() {
		
		console.log('PLAYLIST');
		
		// Figure out the position in the playlist that we're at
		var i = 0;
		Blackbox.playlist.forEach(function(item) {
			if ( i == Blackbox.playlistPosition ) {
				console.log('>> Track #', i, ' - ', item['title']);
			} else {
				console.log('Track #', i, ' - ', item['title']);
			}
			i++;
		});
		
		// Now we set pos
		var pos = Blackbox.playlistPosition;
		if (pos != null) {
			if (pos+1 <= Blackbox.playlist.length-1) {
				var track_id = Blackbox.playlist[pos+1]['id'];
				var post_id = Blackbox.playlist[pos+1]['post_id'];
				
				Blackbox.playlistPosition += 1;
				console.log('loading trackID', track_id, ' position ', pos+1)
				Listunes.loadTrack(track_id, post_id);
				return 1;
			}
		}
		
		return 0; // error
	},
	prevTrack: function() {
		var pos = Blackbox.playlistPosition;
		console.log('PLAYLIST');
		var i = 0;
		Blackbox.playlist.forEach(function(item) {
			console.log('Track #', i, ' - ', item['title']);
		});
		
		if (pos != null) {
			if (pos-1 >= 0) {
				var track_id = Blackbox.playlist[pos-1]['id'];
				var post_id = Blackbox.playlist[pos-1]['post_id'];
				
				Listunes.loadTrack(track_id, post_id);
				return 1;
			}
		}
		
		return 0; //error
	},
	addTrackToPlaylist: function(id, post_id, title) {
		Blackbox.playlist.push({'id': id, 'post_id': post_id, 'title': title });
		$('#player #playlist #playlist-view ul').append('<li><a href="#" onclick="javascript:Listunes.loadTrack('+id+', '+post_id+'); return false;">'+title.replace('"','')+'</a></li>');
	},
	resetPlaylist: function() {
		Blackbox.playlist = new Array();
	},
	soundObj: function() {
		return soundManager.getSoundById(Blackbox.sID);
	},
	setPosition: function(percent) {
		var pos = Math.round( (percent / 100)*Blackbox.soundObj().durationEstimate );
		if (Blackbox.debug) { console.log('setPosition: ', pos, 'ms', 'Duration:', Blackbox.soundObj().durationEstimate, 'Pos:', Blackbox.soundObj().position); }
		Blackbox.soundObj().setPosition(pos);
	},
	getProgress: function() {
		var duration = Blackbox.soundObj().durationEstimate;
		var elapsed_time = Blackbox.soundObj().position;
		var progress = (100/duration) * elapsed_time;
		//console.log('Duration: ', duration, 'Elapsed: ', elapsed_time, 'Progress:', progress, '%')
		return progress;
	},
	getTimeElapsed: function() {
	
		var t = new Date(Blackbox.soundObj().position);
		var sec = t.getSeconds();
	
		if (sec.toString().length < 2) { sec = '0' + sec.toString(); }		
		
		return t.getMinutes() + ':' + sec;
	},
	getDuration: function() {
		var t = new Date(Blackbox.soundObj().durationEstimate);
		var sec = t.getSeconds();
		
		if (sec.toString().length < 2) { sec = '0' + sec.toString(); }	
		
		return t.getMinutes() + ':' + sec;
	},
	getTrackTitle: function() {
		return this.track_title;
	},
	extractSoundcloudTrackID: function(html) {
		var start = (new Date).getTime();
		
		var txt = html;
		var re1='.*?';	// Non-greedy match on filler
		var re2='(tracks)';	// Word 1
		var re3='(\\/)';	// Any Single Character 1
		var re4='(\\d+)';	// Integer Number 1

		var p = new RegExp(re1+re2+re3+re4,["i"]);
		var m = p.exec(txt);
		if (m != null)
		{
			var word1=m[1];
			var c1=m[2];
			var int1=m[3];
			
			if (Blackbox.debug) {
				var diff = (new Date).getTime() - start;
				
				console.log('TrackID: ', int1);
				console.log('extractSoundCloudTrackID ran in ', diff, 'ms');
			}
			
			return int1;
		} else {
			return null;
		}
	},
	setTrackLinks: function() {
	
		if (Blackbox.via != undefined) {
			this.track_link = 'Posted by <a id="read-more-link" class="link-button gray" target="_blank" href="'+Blackbox.post_url+'">'+Blackbox.via+'</a>';
		} else {
			this.track_link = '';
		}
		
		
		switch(this.type) {
			
			case "mp3":
				this.track_link = this.track_link + ' | <a id="download-link" class="link-button green" target="_blank" href="'+Blackbox.media_url+'">MP3</a>';
				 break;
				 /*
			case "soundcloud":
				this.track_link = this.track_link + ' | <a id="soundcloud-link" class="link-button orange" target="_blank" href="'+Blackbox.media_url+'">Soundcloud</a>';
				break;
				*/
			default:
			
				break;
		}
		
		$('#player #links').html(this.track_link);
		
		$('#player #links-container').animate({
			left: '0'
			}, 500, function() {

		});		
	},
	getSoundcloudTrackID: function(url) {
		var start = (new Date).getTime();
		
		var target_url = this.static_root + 'reverse/soundcloud/';
		console.log('AJAX Target:',target_url)
		var title = null;
		var html = null;
		var track_id = null;
		
		// Reverse the SoundCloud URL
		// gives: track title, embed html
		jQuery.ajax({
			dataType: 'json',
			type: 'POST',
			url: target_url,
			data: { track_url : url },
			async: false,
			success: function(data) {
				
				title = data.title;
				track_id = Blackbox.extractSoundcloudTrackID(unescape(data.html));
				
				if (Blackbox.debug) {
					var diff = (new Date).getTime() - start;
					console.log('REST (Soundcloud) Success: ', data.title);
					console.log('getSoundCloudTrackID ran in ', diff, 'ms');
				}
				
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (Blackbox.debug) {
					console.log(jqXHR, textStatus, errorThrown);
				}
				
				return null;
			}
		});
		
		return track_id;
	},
	update: function(args) {
		var default_args = {
			'title': 'Unknown Track',
			'artist': 'Unknown Artist',
			'source': 'Unknown Source',
			'media_url': '#'
		}
		
		for (var index in default_args) {
			if (typeof args[index] == 'undefined') args[index] = default_args[index];
			console.log(index, ': ',args[index]);
		}

		Blackbox.track_title = args['title'];
		Blackbox.track_artist = args['artist'];
		Blackbox.track_source = args['source'];
		Blackbox.media_url = args['media_url'];		
	},
	updatePlayer: function() {
		var progress_str =  Blackbox.getProgress().toPrecision(4) + '%';
		var volume_str =  Blackbox.volume().toPrecision(4) + '%';
		// Update player info being displayed
		$('#player #title').html(this.track_title);
		$('#player #time #time-elapsed').html(this.getTimeElapsed);
		$('#player #time #time-total').html(this.getDuration);
		$('#player #scrubber #progress').css('width', progress_str);
		$('#player #volume #level').css('width', volume_str);

	}
}

$(document).ready(function() {

	
	$('#player #title-container').click(function(e){
		// position = (100/window_width)*(mouse_click_x_pos - progress_bar_left_x_offset)
		var pos = (100/$(this).width())*(e.pageX - this.offsetLeft);
		Blackbox.setPosition(pos);
	});
	
	$('#player #volume').click(function(e){
		// position = (100/window_width)*(mouse_click_x_pos - progress_bar_left_x_offset)
		//console.log('width: ', $(this).width(), 'e.pageX', e.pageX, 'this.offsetLeft', this.offsetLeft);
		var pos = (100/$(this).width())*(e.pageX - this.offsetLeft - $('#player #volume-container').offset().left );
		Blackbox.volume(pos);
	});
});
