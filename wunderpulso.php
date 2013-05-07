<?php
/**
Plugin Name: wunderpulso
Version: 1.0
Plugin URI: 
Description: Custom plugin to integrate PulsoViral.com feeds with WordPress
Author: James Currie
Author URI: http://www.wunderdojo.com

------------------------------------------------------------------------
Copyright 2012 wunderdojo LLC

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
*/

/**
 * @author James Currie
 * @package wunderpulso
 * @version 1.0

 */
 
 class wunderpulso {
	
	/** class constants */
	private     $version = '1.0';
	protected 	$options_name = 'wunderpulso_options';
	//private 	$url = "http://data.pulsoviral.com:5984/pulso_275/_design/front/_list/jsonp/txtsbydate_dos?format=json&amp;callback=?";
	private $url = "http://data.pulsoviral.com:5984/pulso_1399/_design/front/_view/txtsbydate_dos?limit=10&reduce=false&descending=true";
	/** these things get set / done when we instantiate a new instance of wunderpulso */
	function __construct(){
	add_shortcode('PULSO', array(&$this, 'pulso_init'));
	/* define some properties */
	$this->set('plugin_dir', trailingslashit(plugin_dir_path(__FILE__)));
	$this->set('plugin_url', plugins_url('',__FILE__));
	/* hook to check and see if we're on a pulso page and should include the js */
	//add_action('template_redirect', array(&$this, 'pulso_check'));
	}//end of __construct
	
	/* Getters & Setters */
	function set($key, $value) {          
             $this->$key = $value;
    }       

    function get($key) {
            return $this->$key;
    } 
	
	/* set up our scripts */
	function load_scripts(){
		wp_register_script('wunderpulso', $this->get('plugin_url').'/js/wunderpulso.js', array('jquery'), '1.0', true );  
		wp_enqueue_script('wunderpulso');  
	}
	
	/** DEV NOTES
	Ideally we would set options on either the page editing screen or from within the pulso options screen to "add pulso" to a page. That would trigger inclusion of the necessary javascript and apply it to the selected element id or class 
	*/
	function pulso_init(){
		//if(is_page(array('homepage', 'home-beta'))){
		/* we're on our pulso page */
		//$this->load_scripts();
		$content = $this->getContent($this->url);
		$content = $this->parseContent($content);
		$this->displayContent($content);
		//};
	}
	
	
	/* process the returned data */
	/* pulso_family identifies the service -- Twitter, Instagram, etc. 
	/* pulso_pics is an array of images
	/* pulso_cuando is the date as a timestamp
	*/
	function getContent($url) {
		if (function_exists('curl_init')) {
			$ch = curl_init();
			curl_setopt($ch, CURLOPT_URL, $url);
			curl_setopt($ch, CURLOPT_HEADER, 0);
			curl_setopt($ch, CURLOPT_TIMEOUT, 600);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.7.5) Gecko/20041107 Firefox/1.0');
			$content = curl_exec($ch);
			curl_close($ch);
		} else {
			// curl library is not installed so we better use something else
			$content = file_get_contents($url);
		}
		return $content;
	}
	
	function parseContent($content){
		$socialposts = json_decode($content);
		$i=0;
		foreach($socialposts->rows as $row){
			$i++;
			$output[$i]['family'] = $family = $row->value->pulso_family;
				switch($family){
					case('twitter'):
						$content = $row->value->text;
						$content = $this->updateTweetUrls($content);
						$from_user = "@".$row->value->from_user;
						$image_small = $row->value->profile_image_url;
						$image_large = str_replace('_normal', '', $image_small);
						$image_pulso = $row->value->pulso_pics[0];
						$image = ($image_pulso)? $image_pulso:$image_large;
						$link = "https://twitter.com/".$row->value->from_user."/status/".$row->value->id_str;
						$more = "view tweet";
					break;
					
					case('facebook'):
						$message = $row->value->message;
						$story = $row->value->story;
						$description = $row->value->description;
							switch($row->value->type){
								case('photo' OR 'link'):
								$content = $row->value->name;
								if($message){$content.="".$message;}
								elseif($story){$content.="".$story;}
								break;
								
								case('shared_story'):
								
								break;
							}
						if($message){$content= $message;}
						elseif($description){$content=$description;}
						$content = $this->updateTweetUrls($content);
						$from_user = $row->value->from->name;
						$image_small = "http://graph.facebook.com/".$row->value->from->id."/picture";
						$image_large = "http://graph.facebook.com/".$row->value->from->id."/picture?type=large";
						$image_pulso = $row->value->pulso_pics[0];
						$image = ($image_pulso)? $image_pulso:$image_large;
						//$link = $row->value->link;
						$pieces = explode("_",$row->value->id);
						$link = "http://facebook.com/".$pieces[1]."/posts/".$pieces[2];
						$more ="view post";
					break;
					
					case('instagram'):
						$content = $row->value->caption->text;
						$from_user = $row->value->user->full_name;
						$link = $row->value->link;
						$more = "view pic";
						
					break;
					
					default:
						
					break;
				}//end of switch
			$output[$i]['from_user']=$from_user;
			$output[$i]['image']=$image;
			/* figure out if image is vertical or horizontal orientation */
			//list($width, $height, $type, $attr) = getimagesize($image);
			//$output[$i]['orientation']=($width > $height)?'landscape':'portrait';
			$output[$i]['text']= (strlen(strip_tags($content)) > 120)? substr(strip_tags($content), 0, 120)."..." : $content;	
			$output[$i]['link'] = $link;
			$output[$i]['more']=$more;
		};
		return $output;
	}
	
	function displayContent($content){
	//print_r($content);
		$out='<div class="pulso-wrap"><div class="pulso"><div id="myCarousel" class="carousel slide">';
			$out.='<div class="carousel-inner" >';
				$first = 0;
				foreach($content as $entry){
				$class = ($first==0) ? 'active' : '' ;
					$out.='<div class="item '.$class.'">';
					
					/* start the image orientation stuff */
					//$out.= '<div class="pulso-content left '.$entry['orientation'].'">';
					//$out.='<img src="'.$entry['image'].'">';
					//$out.="</div>";
					$first ++;
					$out.="<div class='pulso-quote'>";
					$out.= $entry['text'];
					$out.='</div>';//pulso-quote
					$out.="<h4 style='margin-top:8px;float:right'>&mdash; ".$entry['from_user']."</h4>";
					$out.="<a style='clear:both;margin-top:5px;float:right' target='_blank' href='".$entry['link']."'>".$entry['more']."</a>";
					$out.="<div class='pulso-service'><i class='icon-".$entry['family']."'></i></div>";
					$out.='</div>';//end of item
					}
				$out.='</div>';//carousel-inner
			$out.="<div class='clearfix'></div></div>";//myCarousel
			//$out.='<a class="pulso-next" href="#myCarousel" data-slide="next"><i class="icon-caret-right"></i></a>';
			//$out.='<a class="pulso-prior" href="#myCarousel" data-slide="prev" ><i class="icon-caret-left"></i></a><div class="clearfix"></div>';
			$out.='<div class="clearfix"></div></div></div>';//myCarousel & pulso & pulso-wrap
		echo $out;
	}
	
	private function updateTweetUrls($content) {
		$maxLen = 16;
		//split long words
		$pattern = '/[^\s\t]{'.$maxLen.'}[^\s\.\,\+\-\_]+/';
		$content = preg_replace($pattern, '$0 ', $content);

		//
		$pattern = '/\w{2,4}\:\/\/[^\s\"]+/';
		$content = preg_replace($pattern, '<a href="$0" title="" target="_blank">$0</a>', $content);

		//search
		$pattern = '/\#([a-zA-Z0-9_-]+)/';
		$content = preg_replace($pattern, '<a href="https://twitter.com/#%21/search/%23$1" title="" target="_blank">$0</a>', $content);

		//user
		$pattern = '/\@([a-zA-Z0-9_-]+)/';
		$content = preg_replace($pattern, '<a href="https://twitter.com/#!/$1" title="" target="_blank">$0</a>', $content);

		return $content;
	}
	

 
 } /** end of class */
 
 $wunderpulso = new wunderpulso();
 ?>