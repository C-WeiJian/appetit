#!/usr/bin/python
#+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
#|R|a|s|p|b|e|r|r|y|P|i|-|S|p|y|.|c|o|.|u|k|
#+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
#
# ultrasonic_1.py
# Measure distance using an ultrasonic module
#
# Ultrasonic related posts:
# http://www.raspberrypi-spy.co.uk/tag/ultrasonic/
#
# Author : Matt Hawkins
# Date   : 16/10/2016
# -----------------------

# Import required Python libraries
from __future__ import print_function
import time
import RPi.GPIO as GPIO
import httplib
import json

# Use BCM GPIO references
# instead of physical pin numbers
GPIO.setmode(GPIO.BCM)

# Define GPIO to use on Pi
GPIO_TRIGGER = 17
GPIO_ECHO    = 4
GPIO_LED     = 27
GPIO_SWITCH1     = 22
GPIO_SWITCH2     = 23
GPIO_TRIGGER2 = 25
GPIO_ECHO2    = 24

# Speed of sound in cm/s at temperature
temperature = 20
speedSound = 33100 + (0.6*temperature)

print("Ultrasonic Measurement")
print("Speed of sound is",speedSound/100,"m/s at ",temperature,"deg")

# Set pins as output and input
GPIO.setup(GPIO_TRIGGER,GPIO.OUT)  # Trigger
GPIO.setup(GPIO_ECHO,GPIO.IN)      # Echo
GPIO.setup(GPIO_TRIGGER2,GPIO.OUT)  # Trigger 2
GPIO.setup(GPIO_ECHO2,GPIO.IN)      # Echo 2  
GPIO.setup(GPIO_LED,GPIO.OUT)      # LED
GPIO.setup(GPIO_SWITCH1,GPIO.IN)      # SWITCH1
GPIO.setup(GPIO_SWITCH2,GPIO.IN)      # SWITCH2

default_height = 0
state = 0
state2 = 0
distance11 = [100]*3
distance22 = [100]*3

addr = { 
            "id": "mid.$cAAWhXKykWWRmBcLRAFf1H2H8weFi",
            "channelId": "facebook",
            "user": {
                "id": "1393559340772993",
                "name": "Crystal Chang"
            },
            "conversation": {
                "isGroup": False,
                "id": "1393559340772993-1584793678243837"
            },
            "bot": {
                "id": "1584793678243837",
                "name": "bot_appetit"
            },
            "serviceUrl": "https://facebook.botframework.com"
}

headers = { "Content-type": "application/json"}

try: 
	conn = httplib.HTTPConnection('appetit.azurewebsites.net')

except:
	print('Cannot connect.')

while 1:
	scenario = (GPIO.input(GPIO_SWITCH1)+GPIO.input(GPIO_SWITCH2))+1

	# Set trigger to False (Low)
	GPIO.output(GPIO_TRIGGER, False)
	GPIO.output(GPIO_TRIGGER2, False)

	# Allow module to settle
	time.sleep(0.5)

	# Send 10us pulse to trigger
	GPIO.output(GPIO_TRIGGER, True)
	
	# Wait 10us
	time.sleep(0.00001)
	GPIO.output(GPIO_TRIGGER, False)
	
	start = time.time()

	while GPIO.input(GPIO_ECHO)==0:
		start = time.time()

	while GPIO.input(GPIO_ECHO)==1:
		stop = time.time()

	GPIO.output(GPIO_TRIGGER2, True)
	# Wait 10us
	time.sleep(0.00001)
	GPIO.output(GPIO_TRIGGER2, False)
	
	start2 = time.time()
	
	while GPIO.input(GPIO_ECHO2)==0:
		start2 = time.time()
		
	while GPIO.input(GPIO_ECHO2)==1:
		stop2 = time.time()

	# Calculate pulse length
	elapsed = stop-start
	elapsed2 = stop2-start2

	# Distance pulse travelled in that time is time
	# multiplied by the speed of sound (cm/s)
	distance = elapsed * speedSound
	distance2 = elapsed2 * speedSound

	# That was the distance there and back so halve the value
	distance = distance / 2
	distance2 = distance2 / 2
	
	avg1 = distance
	
	distance22.insert(0,distance2)
	distance22.pop()
	avg2 = (distance22[0]+distance22[1]+distance22[2])/3
	
	#~ print(GPIO.input(GPIO_SWITCH1),GPIO.input(GPIO_SWITCH2))
	#~ print(distance)
	#~ print(distance2)
	
	if(default_height==0):
		default_height=distance
	
	
	if((default_height-avg1 > 1) and state==0):
		print('Weight added. Registering weight:')
		print("Mass of food wastage : {0:5.1f}".format((default_height-avg1)*50))
		GPIO.output(GPIO_LED,1)
		
		packet=	{'id': 1, 'scenario': scenario, 'mealStatus': 'Returned', 'mass': float("{0:.2f}".format((default_height-avg1)*50)), 'address': addr}
		packet=json.dumps(packet)
		conn.request('PUT', '/belt', packet, headers=headers)
		response = conn.getresponse()
		response.read()
		
		time.sleep(3)
		state=1
		
	elif((default_height-avg1 > 2) and state==1):{}
		
	else:
		if(state2 == 1):
			print('Food awaiting collection!')
		else: 
			print('No weight registered.')
			GPIO.output(GPIO_LED,0)
			state=0
		time.sleep(1)


	if(avg2<10 and state2 == 0):
		print('Food ready!')
		state2 = 1
		
		packet=	{'id': 2, 'scenario': scenario, 'mealStatus': 'Ready', 'mass': 500, 'address': addr}
		packet=json.dumps(packet)
		conn.request('PUT', '/belt', packet, headers=headers)
		response = conn.getresponse()
		response.read()
		
		time.sleep(3)
		
	elif(avg2>10 and state2 == 1):
		print('Food collected, enjoy your meal!')
		
		packet=	{'id': 2, 'scenario': scenario, 'mealStatus': 'Collected', 'mass': 500, 'address': addr}
		packet=json.dumps(packet)
		conn.request('PUT', '/belt', packet, headers=headers)
		response = conn.getresponse()
		response.read()
		
		state2 = 0
		time.sleep(3)
	
	# Reset GPIO settings

		
GPIO.cleanup()
